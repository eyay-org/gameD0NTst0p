import mysql.connector
import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')
DB_PORT = os.getenv('DB_PORT')

def main():
    cnx = None
    cursor = None
    try:
        # Önce veritabanı olmadan bağlan (Create DB komutu için)
        cnx = mysql.connector.connect(
            host=DB_HOST, 
            user=DB_USER, 
            password=DB_PASS,
            port=int(DB_PORT)
        )
        
        print("Veritabanı sunucusuna bağlanıldı.")
        cursor = cnx.cursor()
        
        # SQL dosyasını oku
        sql_path = os.path.join(os.path.dirname(__file__), 'dbsetup.sql')
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
            
        # Komutları ayır ve çalıştır
        commands = sql_script.split(';')
        
        for command in commands:
            cleaned_command = command.strip()
            if cleaned_command:
                try:
                    cursor.execute(cleaned_command)
                    # print(f"Executed: {cleaned_command[:30]}...")
                except mysql.connector.Error as err:
                    print(f"Hata (Komut atlandı): {err}")
                    print(f"Komut: {cleaned_command[:50]}...")
        
        cnx.commit()
        print("dbsetup.sql başarıyla çalıştırıldı.")
        
    except mysql.connector.Error as err:
        print(f"Genel Hata: {err}")
    finally:
        if cursor: cursor.close()
        if cnx and cnx.is_connected():
            cnx.close()

if __name__ == "__main__":
    main()
