from igdb.wrapper import IGDBWrapper
import os
from dotenv import load_dotenv

# .env dosyasındaki değişkenleri yükle
load_dotenv()

# 1. Ortam Değişkenlerini Al
CLIENT_ID = os.getenv("IGDB_CLIENT_ID")
ACCESS_TOKEN = os.getenv("IGDB_ACCESS_TOKEN")

wrapper = IGDBWrapper(CLIENT_ID, ACCESS_TOKEN)

if __name__ == "__main__":
    print(
        wrapper.api_request("games", "fields name; limit 5; offset 0;")
    )  # Example request to see if the wrapper is working
