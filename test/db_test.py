import json
try:
    # igdb_service.py dosyasındaki yapılandırılmış wrapper'ı import et
    from igdb_service import wrapper 
except ImportError:
    print("HATA: igdb_service.py bulunamadı veya içinde 'wrapper' nesnesi yok.")
    print("Lütfen Client ID ve geçerli Access Token ile bu dosyayı oluşturduğunuzdan emin olun.")
    exit()
except Exception as e:
    print(f"igdb_service.py import edilirken hata: {e}")
    exit()

# Rating bilgisi olma ihtimali yüksek bir oyun arayalım
# search_term = "Grand Theft Auto V" 
search_term = "Cyberpunk 2077" # Veya başka popüler bir oyun

# API Sorgusu: Sadece oyun adı ve TÜM age_ratings alt alanlarını isteyelim
api_sorgusu = (
    f"fields name, age_ratings.*; " # age_ratings.* ile tüm alt alanları istiyoruz
    f"search \"{search_term}\"; "
    f"limit 1;" # Tek bir sonuç yeterli
)

print(f"IGDB API'ye '{search_term}' için sorgu gönderiliyor...")
print(f"Kullanılan Sorgu: {api_sorgusu}")

try:
    # API isteğini yap
    byte_array = wrapper.api_request('games', api_sorgusu)
    games_list = json.loads(byte_array)

    # Sonuçları işle
    if not games_list:
        print("Bu arama için oyun bulunamadı.")
    else:
        # Genellikle arama tek bir oyun döndürür
        for game in games_list:
            print(f"\n--- Oyun Adı: {game.get('name')} ---")
            
            # 'age_ratings' alanı yanıtta var mı diye kontrol et ve yapısını yazdır
            if 'age_ratings' in game:
                print("Gelen 'age_ratings' verisinin ham yapısı:")
                # JSON'u daha okunaklı yazdırmak için indent=2 kullanıyoruz
                print(json.dumps(game['age_ratings'], indent=2)) 
            else:
                print("'age_ratings' alanı bu oyun için API yanıtında bulunamadı.")
            print("---------------------------------")

except Exception as e:
    print(f"\nAPI isteği sırasında bir hata oluştu: {e}")
    print("İpuçları:")
    print("- igdb_service.py dosyanızdaki Client ID ve Access Token'ın geçerli ve süresinin dolmamış olduğundan emin olun.")
    print("- İnternet bağlantınızı kontrol edin.")