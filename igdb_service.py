from igdb.wrapper import IGDBWrapper
import os
from dotenv import load_dotenv

# .env dosyasındaki değişkenleri yükle
load_dotenv()

# 1. Ortam Değişkenlerini Al
CLIENT_ID = os.getenv('IGDB_CLIENT_ID')
ACCESS_TOKEN = os.getenv('IGDB_ACCESS_TOKEN')

# 2. Kontrol Et (Hata Ayıklama İçin Önemli)
if not CLIENT_ID or not ACCESS_TOKEN:
    print("HATA: .env dosyasında 'IGDB_CLIENT_ID' veya 'IGDB_ACCESS_TOKEN' eksik.")
    # Burada exit() yapmıyoruz, çağıran kod (dataload.py) hatayı yönetsin diye.
    # Ama wrapper oluştururken hata verecektir.

# 3. Wrapper Nesnesini Oluştur
try:
    wrapper = IGDBWrapper(CLIENT_ID, ACCESS_TOKEN)
except Exception as e:
    print(f"IGDB Wrapper oluşturulurken hata: {e}")
    wrapper = None