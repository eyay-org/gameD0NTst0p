import mysql.connector
import json
import os
import random
from dotenv import load_dotenv
from igdb_service import wrapper

# 2. VERİTABANI BİLGİLERİNİ .env DOSYASINDAN YÜKLE
load_dotenv()
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")

if not all([DB_HOST, DB_USER, DB_NAME, DB_PORT]):
    print(
        "HATA: .env dosyasında DB_HOST, DB_USER, DB_NAME veya DB_PORT değişkenleri eksik."
    )
    exit(1)

# 3. ETL ADIMLARI


def clear_data(cnx, cursor):
    """
    Veri yüklemeden önce ilgili tabloları sıfırlar (TRUNCATE).
    FK kısıtlamalarını geçici olarak kapatır.
    """
    print("--- Veritabanı Sıfırlanıyor (TRUNCATE) ---")

    tables_to_truncate = [
        "GAME_GENRE",
        "GAME",
        "CONSOLE",
        "PRODUCT_MEDIA",
        "PRODUCT",
        "GENRE",
    ]

    try:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        print("FK kontrolleri kapatıldı.")

        for table in tables_to_truncate:
            print(f"  > '{table}' tablosu boşaltılıyor...", end="")
            try:
                cursor.execute(f"TRUNCATE TABLE {table}")
                print("OK")
            except mysql.connector.Error as err:
                if err.errno == 1146:  # Hata: Table doesn't exist
                    print("Tablo bulunamadı, atlanıyor.")
                else:
                    raise  # Diğer hataları yükselt

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
        # Fetch genres with name and description
        byte_array = wrapper.api_request("genres", "fields name, slug, url; limit 500;")
        genres_list = json.loads(byte_array)
    except Exception as e:
        print(f"API isteği hatası (Genres): {e}")
        return None

    igdb_genre_map = {}
    insert_query = (
        "INSERT INTO GENRE (genre_name, description) VALUES (%s, %s)"
        "ON DUPLICATE KEY UPDATE genre_name = VALUES(genre_name), description = VALUES(description)"
    )
    select_query = "SELECT genre_id FROM GENRE WHERE genre_name = %s"

    print(f"{len(genres_list)} adet tür bulundu. Veritabanına işleniyor...")

    for genre in genres_list:
        try:
            genre_name = genre.get("name")
            # Use slug as description if available, otherwise use a default
            genre_desc = genre.get("slug", "Açıklama yok.")
            if genre_desc:
                genre_desc = genre_desc.replace("-", " ").title()
            else:
                genre_desc = "Açıklama yok."

            cursor.execute(insert_query, (genre_name, genre_desc))
            cursor.execute(select_query, (genre_name,))
            result = cursor.fetchone()
            if result:
                igdb_genre_map[genre["id"]] = result[0]
        except Exception as e:
            print(f"  > Hata ({genre.get('name')}): {e}")
            continue

    cnx.commit()
    print("1. Aşama (Türler) tamamlandı ve veritabanına işlendi.\n")
    return igdb_genre_map


def load_games(cnx, cursor, igdb_genre_map):
    """2. Aşama: Oyunları (PRODUCT ve GAME) yükler ve tüm mevcut verileri çeker."""
    print("2. Aşama: Oyunlar IGDB'den çekiliyor...")

    # --- ESRB RATING MAP (Sayıları Metne Çevirmek için) ---
    ESRB_MAP = {6: "RP", 7: "EC", 8: "E", 9: "E10+", 10: "T", 11: "M", 12: "AO"}

    # --- DİL TİPİ MAP (Sayıları Metne Çevirmek için) ---
    LANG_SUPPORT_TYPE = {1: "audio", 2: "subtitles", 3: "interface"}

    random_offset = random.randint(0, 1000)
    print(f"Oyunlar için rastgele 'offset' değeri {random_offset} olarak ayarlandı.")

    # --- KAPSAMLI API SORGUSU - Tüm mevcut alanları çekiyoruz ---
    api_sorgusu = (
        "fields name, summary, storyline, first_release_date, "
        "platforms.name, platforms.id, "
        "genres, "
        "involved_companies.company.name, involved_companies.developer, involved_companies.publisher, "
        "age_ratings.rating, age_ratings.category, "
        "game_modes.name, "
        "language_supports.language.name, language_supports.language_support_type, "
        "cover.url, cover.image_id, "
        "screenshots.url, screenshots.image_id, "
        "videos.video_id, videos.name, "
        "aggregated_rating, total_rating, rating_count, "
        "websites.url, websites.category; "
        "where platforms = (48, 49, 130, 6) & first_release_date != null & summary != null; "
        f"limit 50; offset {random_offset};"
    )

    try:
        byte_array = wrapper.api_request("games", api_sorgusu)
        games_list = json.loads(byte_array)
    except Exception as e:
        print(f"API isteği hatası (Games): {e}")
        return []  # Return empty list instead of None

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

    # Store game data with media for later processing
    games_with_media = []

    for game in games_list:
        try:
            # --- 1. Verileri Hazırla ---
            game_name = game.get("name", "İsimsiz Ürün")
            print(f"  > İşleniyor: {game_name}")

            # Combine summary and storyline for richer description
            game_summary = game.get("summary", "")
            game_storyline = game.get("storyline", "")
            if game_storyline:
                full_description = (
                    f"{game_summary}\n\n{game_storyline}"
                    if game_summary
                    else game_storyline
                )
            else:
                full_description = game_summary if game_summary else "Açıklama yok."

            game_release = game.get("first_release_date", 0)

            # Generate price based on rating (higher rating = higher price)
            base_price = 29.99
            rating = game.get("total_rating") or game.get("aggregated_rating") or 50
            fake_price = round(base_price + (rating / 10), 2)
            fake_weight = 0.5
            fake_dims = "17x10x1 cm"

            # Extract developer and publisher
            developer, publisher, brand = "Bilinmiyor", "Bilinmiyor", "Bilinmiyor"
            developers = []
            publishers = []

            if "involved_companies" in game:
                for comp in game["involved_companies"]:
                    company_name = comp.get("company", {}).get("name", "Bilinmiyor")
                    if comp.get("developer"):
                        developers.append(company_name)
                    if comp.get("publisher"):
                        publishers.append(company_name)

            if developers:
                developer = ", ".join(developers[:3])  # Limit to first 3
            if publishers:
                publisher = ", ".join(publishers[:3])  # Limit to first 3
                brand = publishers[0]  # Use first publisher as brand

            # Get platform names (comma-separated if multiple)
            platform_names = []
            if "platforms" in game:
                for platform in game["platforms"]:
                    platform_name = platform.get("name")
                    if platform_name:
                        platform_names.append(platform_name)

            # Join platforms and truncate to fit VARCHAR(50) limit
            platform_name = (
                ", ".join(platform_names[:3]) if platform_names else "Bilinmiyor"
            )
            if len(platform_name) > 50:
                # Truncate to fit the column size, try to keep it readable
                platform_name = platform_name[:47] + "..."

            # Extract ESRB Rating
            esrb_rating_text = None
            if "age_ratings" in game:
                for rating in game["age_ratings"]:
                    cat_id = rating.get("category")
                    rating_num = rating.get("rating")
                    if cat_id == 1:  # 1 = ESRB
                        esrb_rating_text = ESRB_MAP.get(rating_num)
                        break

            # Extract Multiplayer info
            multiplayer = False
            if "game_modes" in game:
                for mode in game["game_modes"]:
                    mode_name = mode.get("name", "")
                    if mode_name in (
                        "Multiplayer",
                        "Co-operative",
                        "Massively Multiplayer Online (MMO)",
                    ):
                        multiplayer = True
                        break

            # Extract Language Support
            audio_langs = set()
            subtitle_langs = set()
            if "language_supports" in game:
                for support in game["language_supports"]:
                    lang_name = support.get("language", {}).get("name")
                    if not lang_name:
                        continue

                    support_type_id = support.get("language_support_type")
                    support_type_text = LANG_SUPPORT_TYPE.get(support_type_id)

                    if support_type_text == "audio":
                        audio_langs.add(lang_name)
                    if support_type_text == "subtitles":
                        subtitle_langs.add(lang_name)

            language_support_str = (
                ", ".join(sorted(audio_langs)) if audio_langs else None
            )
            subtitle_languages_str = (
                ", ".join(sorted(subtitle_langs)) if subtitle_langs else None
            )

            # --- 2. PRODUCT Tablosuna Ekle ---
            cursor.execute(
                query_product,
                (
                    game_name,
                    full_description,
                    game_release,
                    fake_price,
                    brand,
                    fake_weight,
                    fake_dims,
                ),
            )
            yeni_product_id = cursor.lastrowid

            # --- 3. GAME Tablosuna Ekle ---
            cursor.execute(
                query_game,
                (
                    yeni_product_id,
                    platform_name,
                    developer,
                    publisher,
                    esrb_rating_text,
                    multiplayer,
                    language_support_str,
                    subtitle_languages_str,
                ),
            )

            # --- 4. GAME_GENRE Tablosuna Ekle ---
            if "genres" in game:
                for igdb_genre_id in game["genres"]:
                    local_genre_id = igdb_genre_map.get(igdb_genre_id)
                    if local_genre_id is not None:
                        cursor.execute(
                            query_game_genre, (yeni_product_id, local_genre_id)
                        )

            # Store game data with media for later processing
            games_with_media.append(
                {
                    "product_id": yeni_product_id,
                    "cover": game.get("cover"),
                    "screenshots": game.get("screenshots", []),
                    "videos": game.get("videos", []),
                }
            )

            cnx.commit()
            print(f"    [OK] EKLENDI (GAME - ID: {yeni_product_id}): {game_name}")

        except Exception as e:
            print(f"    [X] HATA - {game.get('name', 'Bilinmeyen')}: {e}")
            cnx.rollback()
            continue

    print("2. Aşama (Oyunlar) tamamlandı.\n")
    return games_with_media


def load_product_media(cnx, cursor, games_with_media):
    """2b. Aşama: Oyun medyalarını (PRODUCT_MEDIA) yükler."""
    print("2b. Aşama: Oyun medyaları (cover, screenshots, videos) yükleniyor...")

    query_media = (
        "INSERT INTO PRODUCT_MEDIA (product_id, media_type, media_url, order_no, main_image) "
        "VALUES (%s, %s, %s, %s, %s)"
    )

    media_count = 0

    for game_media in games_with_media:
        product_id = game_media["product_id"]
        order_no = 0

        try:
            # Add cover image as main image
            if game_media.get("cover"):
                cover = game_media["cover"]
                cover_url = cover.get("url", "")
                if cover_url:
                    # Convert IGDB image URL format
                    if cover_url.startswith("//"):
                        cover_url = "https:" + cover_url
                        # Upgrade thumbnail size to better quality
                        cover_url = cover_url.replace("/t_thumb/", "/t_cover_big/")
                    elif not cover_url.startswith("http"):
                        image_id = cover.get("image_id", "")
                        if image_id:
                            cover_url = f"https://images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg"

                    cursor.execute(
                        query_media, (product_id, "photo", cover_url, order_no, True)
                    )
                    media_count += 1
                    order_no += 1

            # Add screenshots
            screenshots = game_media.get("screenshots", [])
            for screenshot in screenshots[:10]:  # Limit to 10 screenshots
                screenshot_url = screenshot.get("url", "")
                if screenshot_url:
                    if screenshot_url.startswith("//"):
                        screenshot_url = "https:" + screenshot_url
                        # Upgrade thumbnail size to better quality
                        screenshot_url = screenshot_url.replace(
                            "/t_thumb/", "/t_screenshot_big/"
                        )
                    elif not screenshot_url.startswith("http"):
                        image_id = screenshot.get("image_id", "")
                        if image_id:
                            screenshot_url = f"https://images.igdb.com/igdb/image/upload/t_screenshot_big/{image_id}.jpg"

                    cursor.execute(
                        query_media,
                        (product_id, "photo", screenshot_url, order_no, False),
                    )
                    media_count += 1
                    order_no += 1

            # Add videos
            videos = game_media.get("videos", [])
            for video in videos[:5]:  # Limit to 5 videos
                video_id = video.get("video_id", "")
                if video_id:
                    # IGDB videos are typically YouTube videos
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
                    cursor.execute(
                        query_media, (product_id, "video", video_url, order_no, False)
                    )
                    media_count += 1
                    order_no += 1

            cnx.commit()

        except Exception as e:
            print(f"    [X] HATA (Media - Product ID: {product_id}): {e}")
            cnx.rollback()
            continue

    print(f"2b. Aşama (Medya) tamamlandı. Toplam {media_count} medya eklendi.\n")


def load_consoles(cnx, cursor):
    """3. Aşama: Konsolları (PRODUCT ve CONSOLE) yükler."""
    print("3. Aşama: Konsollar IGDB'den çekiliyor...")

    console_ids = "(48, 49, 130, 167, 169)"

    # Fetch comprehensive platform data
    api_sorgusu = (
        "fields name, summary, platform_logo.url, platform_logo.image_id, "
        "platform_family.name, category, generation, "
        "versions.name, versions.summary, "
        "websites.url, websites.category; "
        f"where id = {console_ids};"
        "limit 10;"
    )

    try:
        byte_array = wrapper.api_request("platforms", api_sorgusu)
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

    query_media = (
        "INSERT INTO PRODUCT_MEDIA (product_id, media_type, media_url, order_no, main_image) "
        "VALUES (%s, %s, %s, %s, %s)"
    )

    # Storage capacity mapping based on generation/platform
    storage_map = {
        1: "8GB",  # First generation
        2: "16GB",
        3: "32GB",
        4: "64GB",
        5: "128GB",
        6: "256GB",
        7: "512GB",
        8: "1TB",
        9: "2TB",
    }

    for console in console_list:
        try:
            # --- 1. Verileri Hazırla ---
            console_name = console.get("name", "İsimsiz Konsol")
            console_summary = console.get("summary", "Açıklama yok.")
            console_brand = console.get("platform_family", {}).get("name", "Bilinmiyor")

            # Try to get generation for storage estimation
            generation = console.get("generation", 8)  # Default to modern generation
            storage = storage_map.get(generation, "1TB")

            # Generate price based on generation
            base_price = 199.99
            fake_price = round(base_price + (generation * 50), 2)

            fake_release_date = "2020-11-12"
            fake_weight = 4.5
            fake_dims = "39x26x10 cm"
            fake_color = "Black"
            fake_accessories = "Controller, HDMI Cable, Power Cable"
            fake_warranty = 12

            # --- 2. PRODUCT Tablosuna Ekle ---
            cursor.execute(
                query_product,
                (
                    console_name,
                    console_summary,
                    fake_release_date,
                    fake_price,
                    console_brand,
                    fake_weight,
                    fake_dims,
                ),
            )
            yeni_product_id = cursor.lastrowid

            # --- 3. CONSOLE Tablosuna Ekle ---
            cursor.execute(
                query_console,
                (
                    yeni_product_id,
                    console_brand,
                    console_name,
                    storage,
                    fake_color,
                    fake_accessories,
                    fake_warranty,
                ),
            )

            # --- 4. Add platform logo as media ---
            platform_logo = console.get("platform_logo")
            if platform_logo:
                logo_url = platform_logo.get("url", "")
                if logo_url:
                    if logo_url.startswith("//"):
                        logo_url = "https:" + logo_url
                        # Upgrade thumbnail size to better quality
                        logo_url = logo_url.replace("/t_thumb/", "/t_logo_med/")
                    elif not logo_url.startswith("http"):
                        image_id = platform_logo.get("image_id", "")
                        if image_id:
                            logo_url = f"https://images.igdb.com/igdb/image/upload/t_logo_med/{image_id}.png"

                    cursor.execute(
                        query_media, (yeni_product_id, "photo", logo_url, 0, True)
                    )

            cnx.commit()
            print(f"  > EKLENDİ (CONSOLE - ID: {yeni_product_id}): {console_name}")

        except Exception as e:
            print(f"  [X] HATA - {console.get('name', 'Bilinmeyen')}: {e}")
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
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            port=int(DB_PORT),
            database=DB_NAME,
        )
        cursor = cnx.cursor()

        # --- 1. Adım: Sıfırlama ---
        clear_data(cnx, cursor)

        # --- 2. Adım: Türleri Yükle ---
        genre_map = load_genres(cnx, cursor)

        # --- 3. Adım: Oyunları Yükle ---
        games_with_media = None
        if genre_map:
            games_with_media = load_games(cnx, cursor, genre_map)
        else:
            print("Tür haritası oluşturulamadığı için oyunlar yüklenemedi.")

        # --- 3b. Adım: Oyun Medyalarını Yükle ---
        if games_with_media:
            load_product_media(cnx, cursor, games_with_media)

        # --- 4. Adım: Konsolları Yükle ---
        load_consoles(cnx, cursor)

        print("Tüm işlemler başarıyla tamamlandı!")

    except mysql.connector.Error as err:
        print(f"Veritabanı bağlantı hatası: {err}")
        if cnx:
            cnx.rollback()
    except Exception as e:
        print(f"Beklenmedik bir hata oluştu: {e}")
        if cnx:
            cnx.rollback()
    finally:
        if cursor:
            cursor.close()
        if cnx:
            cnx.close()


if __name__ == "__main__":
    main()
