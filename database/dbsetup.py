import mysql.connector
from mysql.connector import errorcode
import os                 # <-- YENİ
from dotenv import load_dotenv  # <-- YENİ

# .env dosyasındaki değişkenleri yükle
load_dotenv()             # <-- YENİ

# --- VERİTABANI BAĞLANTI BİLGİLERİ ---
# Değişkenleri hard-code yazmak yerine .env dosyasından çek
DB_HOST = os.getenv('DB_HOST') # <-- GÜNCELLENDİ
DB_USER = os.getenv('DB_USER') # <-- GÜNCELLENDİ
DB_PASS = os.getenv('DB_PASS') # <-- GÜNCELLENDİ
DB_NAME = os.getenv('DB_NAME') # <-- GÜNCELLENDİ
DB_PORT = os.getenv('DB_PORT') # <-- GÜNCELLENDİ

# Script'in çalışabilmesi için tüm değişkenlerin dolu olduğunu kontrol et
if not all([DB_HOST, DB_USER, DB_NAME, DB_PORT]): # <-- DB_PORT'U KONTROLE EKLE
    print("HATA: .env dosyasında DB_HOST, DB_USER, DB_NAME veya DB_PORT değişkenleri eksik.") # <-- HATA MESAJINI GÜNCELLE
    print("Lütfen .env.example dosyasını kopyalayıp .env olarak kaydedin ve doldurun.")
    exit(1)

def create_database(cursor):
    """Veritabanını oluşturur (eğer yoksa)."""
    try:
        cursor.execute(f"CREATE DATABASE {DB_NAME} DEFAULT CHARACTER SET 'utf8mb4'")
        print(f"Veritabanı '{DB_NAME}' başarıyla oluşturuldu.")
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_DB_CREATE_EXISTS:
            print(f"Veritabanı '{DB_NAME}' zaten mevcut.")
        else:
            print(f"Hata: {err}")
            exit(1)

def create_tables(cursor):
    """
    Ara raporda tanımlanan tüm tabloları (18 adet) oluşturur.
    Tablolar, yabancı anahtar (FK) bağımlılıklarına göre doğru sırada oluşturulur.
    """
    TABLES = {}

    # --- SIRA 1: BAĞIMLILIĞI OLMAYAN TABLOLAR ---

    TABLES['CUSTOMER'] = (
        "CREATE TABLE `CUSTOMER` ("
        "  `customer_id` INT NOT NULL AUTO_INCREMENT,"
        "  `first_name` VARCHAR(50) NOT NULL,"
        "  `last_name` VARCHAR(50) NOT NULL,"
        "  `email` VARCHAR(100) NOT NULL,"
        "  `password_hash` VARCHAR(255) NOT NULL,"
        "  `phone` VARCHAR(20),"
        "  `registration_date` DATE,"
        "  `last_login_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,"
        "  `active_status` BOOLEAN DEFAULT TRUE,"
        "  PRIMARY KEY (`customer_id`),"
        "  UNIQUE KEY `uk_email` (`email`)"
        ") ENGINE=InnoDB")

    TABLES['PRODUCT'] = (
        "CREATE TABLE `PRODUCT` ("
        "  `product_id` INT NOT NULL AUTO_INCREMENT,"
        "  `product_name` VARCHAR(200) NOT NULL,"
        "  `description` TEXT,"
        "  `price` DECIMAL(10, 2) NOT NULL,"
        "  `release_date` DATE,"
        "  `product_type` VARCHAR(20),"
        "  `brand` VARCHAR(100),"
        "  `status` VARCHAR(20),"
        "  `weight` DECIMAL(6, 2),"
        "  `dimensions` VARCHAR(50),"
        "  `stock_alert_level` INT DEFAULT 10,"
        "  PRIMARY KEY (`product_id`),"
        "  CONSTRAINT `chk_price` CHECK (`price` > 0)"
        ") ENGINE=InnoDB")

    TABLES['SUPPLIER'] = (
        "CREATE TABLE `SUPPLIER` ("
        "  `supplier_id` INT NOT NULL AUTO_INCREMENT,"
        "  `supplier_name` VARCHAR(150) NOT NULL,"
        "  `payment_terms` VARCHAR(100),"
        "  `active_status` BOOLEAN DEFAULT TRUE,"
        # Rapordaki 'contact_info' kompozit alanı düzleştirildi [cite: 212]
        "  `contact_address` TEXT,"
        "  `contact_phone` VARCHAR(20),"
        "  `contact_email` VARCHAR(100),"
        "  PRIMARY KEY (`supplier_id`)"
        ") ENGINE=InnoDB")

    TABLES['GENRE'] = (
        "CREATE TABLE `GENRE` ("
        "  `genre_id` INT NOT NULL AUTO_INCREMENT,"
        "  `genre_name` VARCHAR(50) NOT NULL,"
        "  `description` TEXT,"
        "  PRIMARY KEY (`genre_id`),"
        "  UNIQUE KEY `uk_genre_name` (`genre_name`)"
        ") ENGINE=InnoDB")

    # --- SIRA 2: SIRA 1'DEKİ TABLOLARA BAĞIMLI OLANLAR ---

    TABLES['ADDRESS'] = (
        "CREATE TABLE `ADDRESS` ("
        "  `address_id` INT NOT NULL AUTO_INCREMENT,"
        "  `customer_id` INT,"
        "  `address_type` VARCHAR(20),"
        "  `city` VARCHAR(100),"
        "  `district` VARCHAR(100),"
        "  `neighborhood` VARCHAR(100),"
        "  `full_address` TEXT,"
        "  `postal_code` VARCHAR(10),"
        "  `default_address` BOOLEAN DEFAULT FALSE,"
        "  PRIMARY KEY (`address_id`),"
        "  CONSTRAINT `fk_address_customer`"
        "    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)"
        "    ON DELETE CASCADE"
        ") ENGINE=InnoDB")

    TABLES['GAME'] = (
        "CREATE TABLE `GAME` ("
        "  `product_id` INT NOT NULL,"
        "  `platform` VARCHAR(50),"
        "  `developer` VARCHAR(100),"
        "  `publisher` VARCHAR(100),"
        "  `ESRB_rating` VARCHAR(10),"
        "  `multiplayer` BOOLEAN,"
        "  `language_support` TEXT,"
        "  `subtitle_languages` TEXT,"
        "  PRIMARY KEY (`product_id`),"
        "  CONSTRAINT `fk_game_product`"
        "    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)"
        "    ON DELETE CASCADE"
        ") ENGINE=InnoDB")

    TABLES['CONSOLE'] = (
        "CREATE TABLE `CONSOLE` ("
        "  `product_id` INT NOT NULL,"
        "  `manufacturer` VARCHAR(100),"
        "  `model` VARCHAR(100),"
        "  `storage_capacity` VARCHAR(20),"
        "  `color` VARCHAR(30),"
        "  `included_accessories` TEXT,"
        "  `warranty_period` INT,"
        "  PRIMARY KEY (`product_id`),"
        "  CONSTRAINT `fk_console_product`"
        "    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)"
        "    ON DELETE CASCADE"
        ") ENGINE=InnoDB")

    TABLES['PRODUCT_MEDIA'] = (
        "CREATE TABLE `PRODUCT_MEDIA` ("
        "  `media_id` INT NOT NULL AUTO_INCREMENT,"
        "  `product_id` INT NOT NULL,"
        "  `media_type` VARCHAR(10),"
        "  `media_url` VARCHAR(500),"
        "  `order_no` INT,"
        "  `main_image` BOOLEAN DEFAULT FALSE,"
        "  PRIMARY KEY (`media_id`),"
        "  CONSTRAINT `fk_media_product`"
        "    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)"
        "    ON DELETE CASCADE"
        ") ENGINE=InnoDB")

    TABLES['ORDER'] = (
        "CREATE TABLE `ORDER` ("
        "  `order_id` INT NOT NULL AUTO_INCREMENT,"
        "  `customer_id` INT,"
        "  `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  `order_status` VARCHAR(20),"
        "  `total_amount` DECIMAL(10, 2),"
        "  `shipping_fee` DECIMAL(6, 2),"
        "  `payment_method` VARCHAR(30),"
        "  `payment_status` VARCHAR(20),"
        "  `tracking_number` VARCHAR(50),"
        "  `estimated_delivery_date` DATE,"
        "  `actual_delivery_date` DATE,"
        # Rapordaki 'delivery_address' ve 'billing_address' kompozit alanları düzleştirildi [cite: 124]
        "  `delivery_full_address` TEXT,"
        "  `delivery_city` VARCHAR(100),"
        "  `billing_full_address` TEXT,"
        "  `billing_city` VARCHAR(100),"
        "  PRIMARY KEY (`order_id`),"
        "  CONSTRAINT `fk_order_customer`"
        "    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)"
        "    ON DELETE SET NULL"
        ") ENGINE=InnoDB")

    TABLES['BRANCH'] = (
        "CREATE TABLE `BRANCH` ("
        "  `branch_id` INT NOT NULL AUTO_INCREMENT,"
        "  `address_id` INT,"
        "  `branch_name` VARCHAR(100),"
        "  `phone` VARCHAR(20),"
        "  `email` VARCHAR(100),"
        "  `working_hours` VARCHAR(100),"
        "  `manager_name` VARCHAR(100),"
        "  `opening_date` DATE,"
        "  PRIMARY KEY (`branch_id`),"
        "  CONSTRAINT `fk_branch_address`"
        "    FOREIGN KEY (`address_id`) REFERENCES `ADDRESS` (`address_id`)"
        "    ON DELETE SET NULL"
        ") ENGINE=InnoDB")

    TABLES['CART'] = (
        "CREATE TABLE `CART` ("
        "  `customer_id` INT NOT NULL,"
        "  `product_id` INT NOT NULL,"
        "  `quantity` INT DEFAULT 1,"
        "  `added_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  PRIMARY KEY (`customer_id`, `product_id`),"
        "  CONSTRAINT `fk_cart_customer`"
        "    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)"
        "    ON DELETE CASCADE,"
        "  CONSTRAINT `fk_cart_product`"
        "    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)"
        "    ON DELETE CASCADE"
        ") ENGINE=InnoDB")

    TABLES['REVIEW'] = (
        "CREATE TABLE `REVIEW` ("
        "  `review_id` INT NOT NULL AUTO_INCREMENT,"
        "  `customer_id` INT,"
        "  `product_id` INT NOT NULL,"
        "  `rating` INT NOT NULL,"
        "  `review_title` VARCHAR(200),"
        "  `review_text` TEXT,"
        "  `review_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  `helpful_count` INT DEFAULT 0,"
        "  `approved` BOOLEAN DEFAULT FALSE,"
        "  PRIMARY KEY (`review_id`),"
        "  CONSTRAINT `fk_review_customer`"
        "    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)"
        "    ON DELETE SET NULL,"
        "  CONSTRAINT `fk_review_product`"
        "    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)"
        "    ON DELETE CASCADE,"
        "  CONSTRAINT `chk_rating` CHECK (`rating` >= 1 AND `rating` <= 5)"
        ") ENGINE=InnoDB")

    TABLES['PURCHASE'] = (
        "CREATE TABLE `PURCHASE` ("
        "  `purchase_id` INT NOT NULL AUTO_INCREMENT,"
        "  `supplier_id` INT,"
        "  `product_id` INT,"
        "  `transaction_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  `quantity` INT,"
        "  `unit_cost` DECIMAL(10, 2),"
        "  `total_cost` DECIMAL(10, 2),"
        "  `payment_status` VARCHAR(20),"
        "  `payment_date` DATE,"
        "  `invoice_no` VARCHAR(50),"
        "  PRIMARY KEY (`purchase_id`),"
        "  CONSTRAINT `fk_purchase_supplier`"
        "    FOREIGN KEY (`supplier_id`) REFERENCES `SUPPLIER` (`supplier_id`)"
        "    ON DELETE SET NULL,"
        "  CONSTRAINT `fk_purchase_product`"
        "    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)"
        "    ON DELETE SET NULL"
        ") ENGINE=InnoDB")

    TABLES['GAME_GENRE'] = (
        "CREATE TABLE `GAME_GENRE` ("
        "  `product_id` INT NOT NULL,"
        "  `genre_id` INT NOT NULL,"
        "  PRIMARY KEY (`product_id`, `genre_id`),"
        "  CONSTRAINT `fk_gg_game`"
        "    FOREIGN KEY (`product_id`) REFERENCES `GAME` (`product_id`)"
        "    ON DELETE CASCADE,"
        "  CONSTRAINT `fk_gg_genre`"
        "    FOREIGN KEY (`genre_id`) REFERENCES `GENRE` (`genre_id`)"
        "    ON DELETE CASCADE"
        ") ENGINE=InnoDB")

    # --- SIRA 3: SIRA 2'DEKİ TABLOLARA BAĞIMLI OLANLAR ---

    TABLES['ORDER_DETAIL'] = (
        "CREATE TABLE `ORDER_DETAIL` ("
        "  `order_id` INT NOT NULL,"
        "  `line_no` INT NOT NULL,"
        "  `product_id` INT,"
        "  `quantity` INT,"
        "  `unit_price` DECIMAL(10, 2),"
        "  PRIMARY KEY (`order_id`, `line_no`),"
        "  CONSTRAINT `fk_od_order`"
        "    FOREIGN KEY (`order_id`) REFERENCES `ORDER` (`order_id`)"
        "    ON DELETE CASCADE,"
        "  CONSTRAINT `fk_od_product`"
        "    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)"
        "    ON DELETE SET NULL"
        ") ENGINE=InnoDB")

    TABLES['RETURN'] = (
        "CREATE TABLE `RETURN` ("
        "  `return_id` INT NOT NULL AUTO_INCREMENT,"
        "  `customer_id` INT,"
        "  `order_id` INT,"
        "  `product_id` INT,"
        "  `transaction_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  `quantity` INT,"
        "  `refund_amount` DECIMAL(10, 2),"
        "  `return_reason` TEXT,"
        "  `return_status` VARCHAR(20),"
        "  `refund_date` DATE,"
        "  PRIMARY KEY (`return_id`),"
        "  CONSTRAINT `fk_return_customer`"
        "    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)"
        "    ON DELETE SET NULL,"
        "  CONSTRAINT `fk_return_order`"
        "    FOREIGN KEY (`order_id`) REFERENCES `ORDER` (`order_id`)"
        "    ON DELETE SET NULL,"
        "  CONSTRAINT `fk_return_product`"
        "    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)"
        "    ON DELETE SET NULL"
        ") ENGINE=InnoDB")

    TABLES['SALE'] = (
        "CREATE TABLE `SALE` ("
        "  `sale_id` INT NOT NULL AUTO_INCREMENT,"
        "  `customer_id` INT,"
        "  `order_id` INT,"
        "  `branch_id` INT,"
        "  `transaction_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  `transaction_amount` DECIMAL(10, 2),"
        "  `cost` DECIMAL(10, 2),"
        "  `profit` DECIMAL(10, 2),"
        "  `sale_type` VARCHAR(20),"
        "  PRIMARY KEY (`sale_id`),"
        "  CONSTRAINT `fk_sale_customer`"
        "    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)"
        "    ON DELETE SET NULL,"
        "  CONSTRAINT `fk_sale_order`"
        "    FOREIGN KEY (`order_id`) REFERENCES `ORDER` (`order_id`)"
        "    ON DELETE SET NULL,"
        "  CONSTRAINT `fk_sale_branch`"
        "    FOREIGN KEY (`branch_id`) REFERENCES `BRANCH` (`branch_id`)"
        "    ON DELETE SET NULL"
        ") ENGINE=InnoDB")

    TABLES['INVENTORY'] = (
        "CREATE TABLE `INVENTORY` ("
        "  `inventory_id` INT NOT NULL AUTO_INCREMENT,"
        "  `product_id` INT NOT NULL,"
        "  `branch_id` INT NOT NULL,"
        "  `quantity` INT NOT NULL,"
        "  `minimum_stock` INT DEFAULT 10,"
        "  `maximum_stock` INT DEFAULT 100,"
        "  `shelf_location` VARCHAR(50),"
        "  `last_update_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,"
        "  PRIMARY KEY (`inventory_id`),"
        "  UNIQUE KEY `uk_product_branch` (`product_id`, `branch_id`),"
        "  CONSTRAINT `fk_inv_product`"
        "    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)"
        "    ON DELETE CASCADE,"
        "  CONSTRAINT `fk_inv_branch`"
        "    FOREIGN KEY (`branch_id`) REFERENCES `BRANCH` (`branch_id`)"
        "    ON DELETE CASCADE,"
        "  CONSTRAINT `chk_quantity` CHECK (`quantity` >= 0)"
        ") ENGINE=InnoDB")
        
    # --- Tablo oluşturma döngüsü ---
    for table_name in TABLES:
        table_description = TABLES[table_name]
        try:
            print(f"Tablo oluşturuluyor: {table_name}", end='... ')
            cursor.execute(table_description)
            print("OK")
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                print("zaten mevcut.")
            else:
                print(f"\nHATA: {err.msg}")

def main():
    """Ana bağlantı ve kurulum fonksiyonu."""
    cnx = None
    cursor = None
    try:
        # Önce veritabanı sunucusuna bağlan (veritabanı adı olmadan)
        cnx = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            port=int(DB_PORT)  
        )
        cursor = cnx.cursor()
        
        # Veritabanını oluştur
        create_database(cursor)
        
        # Veritabanını kullanmak için bağlantıyı yeniden yapılandır
        cnx.database = DB_NAME
        
        # Tabloları oluştur
        create_tables(cursor)
        
        print(f"\nVeritabanı '{DB_NAME}' ve tüm tablolar başarıyla ayarlandı.")

    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Kullanıcı adı veya şifre hatalı.")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print(f"Veritabanı '{DB_NAME}' bulunamadı.")
        else:
            print(f"Genel Hata: {err}")
    finally:
        # Bağlantıları kapat
        if cursor:
            cursor.close()
        if cnx:
            cnx.close()

if __name__ == "__main__":
    main()