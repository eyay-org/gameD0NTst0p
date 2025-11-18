import mysql.connector
import json
import os
import random  # <-- 1. YENİ EKLENTİ
from dotenv import load_dotenv

# 1. API WRAPPER'I IMPORT ET
try:
    from igdb_service import wrapper
except ImportError:
    print("HATA: igdb_service.py dosyası bulunamadı veya içinde 'wrapper' nesnesi yok.")
    exit(1)

# 2. VERİTABANI BİLGİLERİNİ .env DOSYASINDAN YÜKLE
load_dotenv()
DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')
DB_PORT = os.getenv('DB_PORT')

if not all([DB_HOST, DB_USER, DB_NAME, DB_PORT]):
    print("HATA: .env dosyasında DB_HOST, DB_USER, DB_NAME veya DB_PORT değişkenleri eksik.")
    exit(1)

# 3. ETL ADIMLARI

def clear_data(cnx, cursor):
    """
    Veri yüklemeden önce ilgili tabloları sıfırlar (TRUNCATE).
    FK kısıtlamalarını geçici olarak kapatır.
    """
    print("--- Veritabanı Sıfırlanıyor (TRUNCATE) ---")
    
    tables_to_truncate = [
        'GAME_GENRE',
        'GAME',
        'CONSOLE',
        'PRODUCT_MEDIA',
        'PRODUCT',
        'GENRE'
    ]
    
    try:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        print("FK kontrolleri kapatıldı.")
        
        for table in tables_to_truncate:
            print(f"  > '{table}' tablosu boşaltılıyor...", end='')
            try:
                cursor.execute(f"TRUNCATE TABLE {table}")
                print("OK")
            except mysql.connector.Error as err:
                if err.errno == 1146: # Hata: Table doesn't exist
                    print("Tablo bulunamadı, atlanıyor.")
                else:
                    raise # Diğer hataları yükselt
        
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        print("FK kontrolleri tekrar açıldı.")
        
        cnx.commit()
        print("Sıfırlama işlemi tamamlandı.\n")
        
    except mysql.connector.Error as err:
        print(f"Sıfırlama sırasında HATA: {err}")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        raise 

def load_genres(cnx, cursor):
    """1. Aşama: Türleri (GENRE) yükler."""
    print("1. Aşama: Türler (Genres) IGDB'den çekiliyor...")
    try:
        byte_array = wrapper.api_request(
            'genres',
            'fields name; limit 500;'
        )
        genres_list = json.loads(byte_array)
    except Exception as e:
        print(f"API isteği hatası (Genres): {e}")
        return None

    igdb_genre_map = {} 
    insert_query = (
        "INSERT INTO GENRE (genre_name, description) VALUES (%s, %s)"
        "ON DUPLICATE KEY UPDATE genre_name = VALUES(genre_name)"
    )
    select_query = "SELECT genre_id FROM GENRE WHERE genre_name = %s"
    
    print(f"{len(genres_list)} adet tür bulundu. Veritabanına işleniyor...")
    
    for genre in genres_list:
        try:
            genre_name = genre.get('name')
            genre_desc = 'Açıklama yok.' 
            cursor.execute(insert_query, (genre_name, genre_desc))
            cursor.execute(select_query, (genre_name,))
            result = cursor.fetchone()
            if result:
                igdb_genre_map[genre['id']] = result[0]
        except Exception as e:
            print(f"  > Hata ({genre.get('name')}): {e}")
            continue
            
    cnx.commit() 
    print("1. Aşama (Türler) tamamlandı ve veritabanına işlendi.\n")
    return igdb_genre_map

# SADECE BU FONKSİYONU DEĞİŞTİRİN
def load_games(cnx, cursor, igdb_genre_map):
    """2. Aşama: Oyunları (PRODUCT ve GAME) yükler. (ESRB VE DİL DEBUG MODU)"""
    print("2. Aşama: Oyunlar IGDB'den çekiliyor (DEBUG MODU)...")
    
    # --- ESRB RATING MAP (Sayıları Metne Çevirmek için) ---
    ESRB_MAP = {
        6: "RP", 7: "EC", 8: "E", 9: "E10+",
        10: "T", 11: "M", 12: "AO"
    }
    
    # --- DİL TİPİ MAP (Sayıları Metne Çevirmek için) ---
    LANG_SUPPORT_TYPE = {
        1: "audio", 2: "subtitles", 3: "interface"
    }
    
    random_offset = random.randint(0, 1000)
    print(f"Oyunlar için rastgele 'offset' değeri {random_offset} olarak ayarlandı.")

    # --- DÜZELTİLMİŞ API SORGUSU ---
    # 'age_ratings' kökünü istemeyi bıraktık, SADECE genişletilmiş alt alanlarını istiyoruz.
    api_sorgusu = (
        "fields name, summary, first_release_date, platforms.name, genres, "
        "involved_companies.company.name, involved_companies.developer, involved_companies.publisher, "
        "age_ratings.rating, age_ratings.category, " # SADECE alt alanları istiyoruz
        "game_modes.name, "
        "language_supports.language.name, language_supports.language_support_type; "
        "where platforms = (48, 49, 130, 6) & first_release_date != null & summary != null;" # Tür zorunluluğunu kaldırdık
        f"limit 50; offset {random_offset};"
    )
    
    try:
        byte_array = wrapper.api_request('games', api_sorgusu)
        games_list = json.loads(byte_array)
    except Exception as e:
        print(f"API isteği hatası (Games): {e}")
        return

    print(f"{len(games_list)} adet oyun bulundu. Veritabanına yükleniyor...")

    query_product = (
        "INSERT INTO PRODUCT "
        "(product_name, description, release_date, product_type, price, brand, status, weight, dimensions)"
        "VALUES (%s, %s, FROM_UNIXTIME(%s), 'game', %s, %s, 'active', %s, %s)" 
    )
    
    query_game = (
        "INSERT INTO GAME (product_id, platform, developer, publisher, ESRB_rating, "
        "multiplayer, language_support, subtitle_languages)" 
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)" 
    )
    
    query_game_genre = "INSERT INTO GAME_GENRE (product_id, genre_id) VALUES (%s, %s)"
    
    for game in games_list:
        try:
            # --- 1. Verileri Hazırla ---
            game_name = game.get('name', 'İsimsiz Ürün')

            # --- DEBUG KODU BAŞLANGIÇ ---
            print(f"\nDEBUG: İşleniyor -> {game_name}")
            if 'age_ratings' in game:
                print(f"  > DEBUG (age_ratings raw): {game['age_ratings']}")
            else:
                print("  > DEBUG (age_ratings raw): Bu alan API yanıtında yok.")
            # --- DEBUG KODU BİTİŞ ---

            game_summary = game.get('summary', 'Açıklama yok.')
            game_release = game.get('first_release_date', 0)
            fake_price = 59.99 
            fake_weight = 0.5 
            fake_dims = "17x10x1 cm" 
            
            developer, publisher, brand = "Bilinmiyor", "Bilinmiyor", "Bilinmiyor"
            if 'involved_companies' in game:
                for comp in game['involved_companies']:
                    if comp.get('developer'):
                        developer = comp.get('company', {}).get('name', 'Bilinmiyor')
                    if comp.get('publisher'):
                        publisher = comp.get('company', {}).get('name', 'Bilinmiyor')
                brand = publisher 
            
            platform_name = "Bilinmiyor"
            if 'platforms' in game and len(game['platforms']) > 0:
                platform_name = game['platforms'][0].get('name', 'Bilinmiyor')
            
            # [cite_start]1. ESRB RATING [cite: 161-162]
            esrb_rating_text = None 
            if 'age_ratings' in game:
                for rating in game['age_ratings']:
                    # --- YENİ DEBUG KODU ---
                    cat_id = rating.get('category')
                    rating_num = rating.get('rating')
                    print(f"  > DEBUG (rating loop): Bulunan Kategori: {cat_id}, Bulunan Rating Sayısı: {rating_num}")
                    # --- YENİ DEBUG KODU BİTİŞ ---

                    if cat_id == 1: # 1 = ESRB
                        esrb_rating_text = ESRB_MAP.get(rating_num)
                        print(f"  > DEBUG (ESRB): Kategori 1 bulundu. Rating: {rating_num} -> Metin: {esrb_rating_text}")
                        break
            
            # [cite_start]2. MULTIPLAYER [cite: 163-164]
            multiplayer = False 
            if 'game_modes' in game:
                for mode in game['game_modes']:
                    if mode.get('name') in ("Multiplayer", "Co-operative"):
                        multiplayer = True
                        break
            
            # [cite_start]3. DİL VE ALTYAZI DESTEĞİ [cite: 165-168]
            audio_langs = set()
            subtitle_langs = set()
            if 'language_supports' in game:
                for support in game['language_supports']:
                    lang_name = support.get('language', {}).get('name')
                    if not lang_name:
                        continue
                        
                    support_type_id = support.get('language_support_type')
                    support_type_text = LANG_SUPPORT_TYPE.get(support_type_id)
                    
                    if support_type_text == "audio":
                        audio_langs.add(lang_name)
                    if support_type_text == "subtitles":
                        subtitle_langs.add(lang_name)
            
            language_support_str = ", ".join(audio_langs) if audio_langs else None
            subtitle_languages_str = ", ".join(subtitle_langs) if subtitle_langs else None
            
            # --- 2. PRODUCT Tablosuna Ekle ---
            cursor.execute(query_product, (
                game_name, game_summary, game_release,
                fake_price, brand, fake_weight, fake_dims
            ))
            yeni_product_id = cursor.lastrowid 
            
            # --- 3. GAME Tablosuna Ekle (Düzeltilmiş verilerle) ---
            cursor.execute(query_game, (
                yeni_product_id, platform_name, developer, publisher, 
                esrb_rating_text, 
                multiplayer, 
                language_support_str, 
                subtitle_languages_str 
            ))
            
            # --- 4. GAME_GENRE Tablosuna Ekle ---
            if 'genres' in game:
                for igdb_genre_id in game['genres']:
                    local_genre_id = igdb_genre_map.get(igdb_genre_id)
                    if local_genre_id is not None:
                        cursor.execute(query_game_genre, (yeni_product_id, local_genre_id))
            
            cnx.commit()
            print(f"  > EKLENDİ (GAME - ID: {yeni_product_id}): {game_name}")
            
        except Exception as e:
            print(f"HATA - {game.get('name')}: {e}")
            cnx.rollback()
            continue
            
    print("2. Aşama (Oyunlar) tamamlandı.\n")

def load_consoles(cnx, cursor):
    """3. Aşama: Konsolları (PRODUCT ve CONSOLE) yükler."""
    print("3. Aşama: Konsollar IGDB'den çekiliyor...")
    
    console_ids = "(48, 49, 130, 167, 169)"
    
    api_sorgusu = (
        f"fields name, summary, platform_logo.url, platform_family.name;"
        f"where id = {console_ids};"
        f"limit 10;"
    )
    
    try:
        byte_array = wrapper.api_request('platforms', api_sorgusu)
        console_list = json.loads(byte_array)
    except Exception as e:
        print(f"API isteği hatası (Consoles): {e}")
        return

    print(f"{len(console_list)} adet konsol bulundu. Veritabanına yükleniyor...")

    query_product = (
        "INSERT INTO PRODUCT "
        "(product_name, description, release_date, product_type, price, brand, status, weight, dimensions)"
        "VALUES (%s, %s, %s, 'console', %s, %s, 'active', %s, %s)" 
    )
    
    query_console = (
        "INSERT INTO CONSOLE (product_id, manufacturer, model, storage_capacity, color, "
        "included_accessories, warranty_period)"
        "VALUES (%s, %s, %s, %s, %s, %s, %s)"
    )

    for console in console_list:
        try:
            # --- 1. Verileri Hazırla ---
            console_name = console.get('name', 'İsimsiz Konsol')
            console_summary = console.get('summary', 'Açıklama yok.')
            console_brand = console.get('platform_family', {}).get('name', 'Bilinmiyor')
            
            fake_release_date = "2020-11-12" 
            fake_price = 499.99
            fake_weight = 4.5
            fake_dims = "39x26x10 cm"
            fake_storage = "1TB"
            fake_color = "Black"
            fake_accessories = "Controller, HDMI Cable"
            fake_warranty = 12
            
            # --- 2. PRODUCT Tablosuna Ekle ---
            cursor.execute(query_product, (
                console_name, console_summary, fake_release_date,
                fake_price, console_brand, fake_weight, fake_dims
            ))
            yeni_product_id = cursor.lastrowid
            
            # --- 3. CONSOLE Tablosuna Ekle ---
            cursor.execute(query_console, (
                yeni_product_id, console_brand, console_name, fake_storage,
                fake_color, fake_accessories, fake_warranty
            ))
            
            cnx.commit()
            print(f"  > EKLENDİ (CONSOLE - ID: {yeni_product_id}): {console_name}")

        except Exception as e:
            print(f"HATA - {console.get('name')}: {e}")
            cnx.rollback()
            continue
            
    print("3. Aşama (Konsollar) tamamlandı.\n")


# 4. ANA ÇALIŞTIRMA FONKSİYONU
def main():
    """Veritabanına bağlanır, sıfırlar ve ETL işlemlerini sırayla çalıştırır."""
    cnx = None
    cursor = None
    try:
        cnx = mysql.connector.connect(
            host=DB_HOST, user=DB_USER, password=DB_PASS,
            port=int(DB_PORT), database=DB_NAME
        )
        cursor = cnx.cursor()
        
        # --- 1. Adım: Sıfırlama ---
        clear_data(cnx, cursor) 
        
        # --- 2. Adım: Türleri Yükle ---
        genre_map = load_genres(cnx, cursor)
        
        # --- 3. Adım: Oyunları Yükle ---
        if genre_map:
            load_games(cnx, cursor, genre_map)
        else:
            print("Tür haritası oluşturulamadığı için oyunlar yüklenemedi.")
        
        # --- 4. Adım: Konsolları Yükle ---
        load_consoles(cnx, cursor)
        
        print("Tüm işlemler başarıyla tamamlandı!")

    except mysql.connector.Error as err:
        print(f"Veritabanı bağlantı hatası: {err}")
        if cnx: cnx.rollback() 
    except Exception as e:
        print(f"Beklenmedik bir hata oluştu: {e}")
        if cnx: cnx.rollback()
    finally:
        if cursor: cursor.close()
        if cnx: cnx.close()

if __name__ == "__main__":
    main()