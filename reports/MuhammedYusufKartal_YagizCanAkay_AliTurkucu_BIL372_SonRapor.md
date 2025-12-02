# BIL372 Veritabanı Sistemleri - Son Rapor

## Fiziksel Oyun ve Konsol Satış Web Sitesi (Physical Game and Console Sales Website)

---

### Proje Grubu Üyeleri

| İsim | Öğrenci No |
|------|------------|
| Muhammed Yusuf Kartal | 231401012 |
| Yağız Can Akay | 231401013 |
| Ali Türkücü | 231401014 |

---

## İçindekiler

1. [Gerçek Dünya Probleminin Tanımı](#1-gerçek-dünya-probleminin-tanımı)
2. [Gereksinim Analizi](#2-gereksinim-analizi)
3. [Kavramsal Tasarım (EER Diyagramları)](#3-kavramsal-tasarım-eer-diyagramları)
4. [Mantıksal Tasarım ve Şema Diyagramları](#4-mantıksal-tasarım-ve-şema-diyagramları)
5. [Tasarımın Uyarlanması](#5-tasarımın-uyarlanması)
6. [Uygulama Programı Tanıtımı ve Örnek Kullanım](#6-uygulama-programı-tanıtımı-ve-örnek-kullanım)
7. [Sonuç](#7-sonuç)
8. [Referanslar](#8-referanslar)

---

## 1. Gerçek Dünya Probleminin Tanımı

### 1.1 Problem Tanımı

Bu proje, fiziksel video oyunu ve oyun konsolu satışı yapan kapsamlı bir B2C (Business-to-Consumer) e-ticaret platformu geliştirmeyi amaçlamaktadır. Günümüzde oyun endüstrisi hızla büyümekte ve tüketiciler hem yeni hem de klasik oyunlara/konsollara erişim talep etmektedir.

### 1.2 Çözüm Yaklaşımı

Geliştirilen sistem şu özellikleri sunmaktadır:

- **Ürün Kataloğu Yönetimi**: Oyunlar ve konsollar için ayrıntılı bilgi depolama
- **Müşteri Etkileşimi**: Kayıt, giriş, sepet yönetimi, sipariş takibi
- **Çoklu Şube Desteği**: Farklı fiziksel mağazalarda envanter yönetimi
- **Tedarikçi İlişkileri**: Ürün tedarik ve satın alma süreçleri
- **Satış Sonrası Hizmetler**: İade ve yorum sistemleri
- **Admin Paneli**: Envanter, sipariş, analitik ve şube yönetimi

### 1.3 Hedef Kullanıcılar

| Kullanıcı Tipi | Açıklama |
|----------------|----------|
| **Müşteriler** | Oyun ve konsol satın alan son kullanıcılar |
| **Yöneticiler (Admin)** | Sistem yönetimi, envanter kontrolü, sipariş işleme |
| **Şube Yöneticileri** | Fiziksel mağaza operasyonları |

---

## 2. Gereksinim Analizi

### 2.1 Fonksiyonel Gereksinimler

#### Müşteri Fonksiyonları

| # | Fonksiyon | Açıklama |
|---|-----------|----------|
| F1 | Ürün Arama | Platform, tür, fiyat aralığı, ESRB derecesi ile filtreleme |
| F2 | Sepet Yönetimi | Ürün ekleme, çıkarma, miktar güncelleme |
| F3 | Sipariş Oluşturma | Ödeme ve teslimat bilgileri ile sipariş verme |
| F4 | Sipariş Takibi | Sipariş durumu ve kargo takip numarası görüntüleme |
| F5 | Yorum Yazma | Satın alınan ürünlere 1-5 puan ve yorum ekleme |
| F6 | Profil Yönetimi | Adres ekleme/silme, şifre değiştirme |
| F7 | İade Talebi | Teslim edilen siparişler için iade başvurusu |

#### Admin Fonksiyonları

| # | Fonksiyon | Açıklama |
|---|-----------|----------|
| A1 | Dashboard | Toplam satış, sipariş sayısı, düşük stok uyarıları |
| A2 | Envanter Yönetimi | Stok seviyelerini görüntüleme ve güncelleme |
| A3 | Sipariş Yönetimi | Sipariş durumlarını güncelleme (pending, shipped, delivered) |
| A4 | Stok Transferi | Şubeler arası ürün transferi |
| A5 | Tedarik (Restock) | Tedarikçilerden ürün satın alma |
| A6 | Mağaza İçi Satış | Fiziksel mağazada satış kaydı |
| A7 | İade İşleme | İade taleplerini onaylama/reddetme |
| A8 | Analitik | Gelir, kar, şube performansı raporları |

### 2.2 Fonksiyonel Olmayan Gereksinimler

| Gereksinim | Açıklama |
|------------|----------|
| **Güvenlik** | Şifre hash'leme (SHA256), session yönetimi |
| **Performans** | Veritabanı indeksleri ile hızlı sorgular |
| **Ölçeklenebilirlik** | Çoklu şube desteği |
| **Kullanılabilirlik** | Modern ve responsive web arayüzü |
| **Veri Bütünlüğü** | Foreign key, CHECK, UNIQUE kısıtlamaları |

### 2.3 İş Kuralları

1. **Fiyat Kontrolü**: Ürün fiyatı 0'dan büyük olmalıdır (`CHECK (price > 0)`)
2. **Stok Kontrolü**: Envanter miktarı negatif olamaz (`CHECK (quantity >= 0)`)
3. **Yorum Puanlama**: Rating 1-5 arasında olmalıdır (`CHECK (rating >= 1 AND rating <= 5)`)
4. **Benzersiz E-posta**: Her müşteri benzersiz e-posta adresine sahip olmalıdır
5. **Ürün Tipi**: Ürünler sadece 'game' veya 'console' tipinde olabilir
6. **Satış Tipi**: Satışlar sadece 'online' veya 'in-store' tipinde olabilir

---

## 3. Kavramsal Tasarım (EER Diyagramları)

### 3.1 Varlıklar (Entities)

Sistemde toplam **19 varlık** bulunmaktadır:

#### Temel Varlıklar (Base Entities)

| Varlık | Açıklama | Anahtar |
|--------|----------|---------|
| **CUSTOMER** | Müşteri bilgileri | customer_id (PK) |
| **PRODUCT** | Ürün üst sınıfı (Superclass) | product_id (PK) |
| **SUPPLIER** | Tedarikçi bilgileri | supplier_id (PK) |
| **GENRE** | Oyun türleri | genre_id (PK) |
| **BRANCH** | Şube bilgileri | branch_id (PK) |

#### Alt Sınıflar (Subclasses)

| Varlık | Üst Sınıf | Açıklama |
|--------|-----------|----------|
| **GAME** | PRODUCT | Oyun detayları (platform, developer, ESRB) |
| **CONSOLE** | PRODUCT | Konsol detayları (manufacturer, storage) |

#### İşlem Varlıkları (Transaction Entities)

| Varlık | Açıklama |
|--------|----------|
| **ORDER** | Müşteri siparişleri |
| **ORDER_DETAIL** | Sipariş kalemleri (Weak Entity) |
| **SALE** | Satış kayıtları |
| **PURCHASE** | Tedarikçiden alımlar |
| **RETURN** | İade işlemleri |

#### Destek Varlıkları (Supporting Entities)

| Varlık | Açıklama |
|--------|----------|
| **INVENTORY** | Şube bazlı stok bilgisi |
| **ADDRESS** | Müşteri adresleri |
| **REVIEW** | Ürün yorumları |
| **CART** | Alışveriş sepeti |
| **PRODUCT_MEDIA** | Ürün görselleri/videoları |
| **GAME_GENRE** | Oyun-Tür ilişkisi (Associative) |
| **STOCK_LOG** | Stok değişiklik logları |

### 3.2 Superclass-Subclass İlişkisi

```
                    PRODUCT (Superclass)
                         |
            discriminator: product_type
                    /          \
                   /            \
              GAME              CONSOLE
         (product_type=        (product_type=
           'game')              'console')
```

**Özellikler:**
- **Specialization Type**: Disjoint (Ayrık) - Bir ürün ya oyun ya da konsol olabilir
- **Completeness**: Total - Her ürün bir alt sınıfa ait olmalıdır
- **Discriminator**: `product_type` alanı ('game' veya 'console')

### 3.3 Weak Entity

**ORDER_DETAIL**, ORDER varlığına bağımlı bir **Weak Entity**'dir:
- **Bileşik Anahtar**: (order_id, line_no)
- **Identifying Relationship**: ORDER → ORDER_DETAIL
- Sipariş silindiğinde ilgili detaylar da silinir (CASCADE)

### 3.4 İlişkiler (Relationships)

#### One-to-Many (1:N) İlişkiler

| İlişki | Açıklama |
|--------|----------|
| CUSTOMER → ORDER | Bir müşteri birden fazla sipariş verebilir |
| CUSTOMER → ADDRESS | Bir müşteri birden fazla adrese sahip olabilir |
| CUSTOMER → REVIEW | Bir müşteri birden fazla yorum yazabilir |
| PRODUCT → REVIEW | Bir ürün birden fazla yorum alabilir |
| PRODUCT → INVENTORY | Bir ürün birden fazla şubede bulunabilir |
| BRANCH → INVENTORY | Bir şube birden fazla ürün stoklar |
| ORDER → ORDER_DETAIL | Bir sipariş birden fazla kalem içerebilir |
| SUPPLIER → PURCHASE | Bir tedarikçiden birden fazla alım yapılabilir |

#### Many-to-Many (M:N) İlişkiler

| İlişki | Associative Entity | Açıklama |
|--------|-------------------|----------|
| GAME ↔ GENRE | GAME_GENRE | Bir oyun birden fazla türe ait olabilir |
| CUSTOMER ↔ PRODUCT | CART | Bir müşteri birden fazla ürünü sepete ekleyebilir |

### 3.5 EER Diyagramı (Metin Gösterimi)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   CUSTOMER  │1     N│   ADDRESS   │       │   SUPPLIER  │
│─────────────│───────│─────────────│       │─────────────│
│ customer_id │       │ address_id  │       │ supplier_id │
│ email (UK)  │       │ city        │       │ supplier_name│
│ is_admin    │       │ full_address│       │ active_status│
└──────┬──────┘       └─────────────┘       └──────┬──────┘
       │                                          │
       │1                                         │1
       │                                          │
       ▼N                                         ▼N
┌─────────────┐                           ┌─────────────┐
│    ORDER    │1     N┌───────────────┐   │  PURCHASE   │
│─────────────│───────│ ORDER_DETAIL  │   │─────────────│
│ order_id    │       │───────────────│   │ purchase_id │
│ order_status│       │ order_id (PK) │   │ quantity    │
│ total_amount│       │ line_no (PK)  │   │ total_cost  │
└──────┬──────┘       │ product_id(FK)│   └──────┬──────┘
       │              └───────────────┘          │
       │                     ▲                   │
       │1                    │N                  │1
       │                     │                   │
       ▼N                    │                   ▼N
┌─────────────┐       ┌──────┴──────┐       ┌─────────────┐
│    SALE     │       │   PRODUCT   │◄──────│  INVENTORY  │
│─────────────│       │─────────────│       │─────────────│
│ sale_id     │       │ product_id  │       │ inventory_id│
│ profit      │       │ product_type│       │ quantity    │
│ sale_type   │       │ price       │       │ branch_id(FK)│
└─────────────┘       └──────┬──────┘       └──────┬──────┘
                             │                     │N
                    ┌────────┴────────┐            │
                    │                 │            ▼1
              ┌─────┴─────┐     ┌─────┴─────┐ ┌─────────────┐
              │   GAME    │     │  CONSOLE  │ │   BRANCH    │
              │───────────│     │───────────│ │─────────────│
              │ platform  │     │manufacturer│ │ branch_id   │
              │ developer │     │ storage   │ │ branch_name │
              │ ESRB_rating│    │ color     │ │ manager_name│
              └───────────┘     └───────────┘ └─────────────┘
                    │
                    │N
                    ▼M
              ┌───────────┐       ┌─────────────┐
              │GAME_GENRE │───────│    GENRE    │
              │───────────│       │─────────────│
              │product_id │       │ genre_id    │
              │ genre_id  │       │ genre_name  │
              └───────────┘       └─────────────┘
```

---

## 4. Mantıksal Tasarım ve Şema Diyagramları

### 4.1 EER'den İlişkisel Modele Dönüşüm

#### Dönüşüm Kuralları Uygulaması

| EER Kavramı | Uygulanan Dönüşüm |
|-------------|-------------------|
| Superclass/Subclass | Her biri için ayrı tablo, subclass PK = FK (PRODUCT → GAME, CONSOLE) |
| Weak Entity | Bileşik PK içerir (ORDER_DETAIL) |
| M:N İlişkisi | Associative entity (GAME_GENRE, CART) |
| Composite Attribute | Ayrı sütunlar (delivery_full_address, delivery_city) |
| Multivalued Attribute | Ayrı tablo (PRODUCT_MEDIA) |

### 4.2 Tablo Şemaları

#### CUSTOMER Tablosu
```sql
CUSTOMER (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    registration_date DATE,
    last_login_date TIMESTAMP,
    active_status BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE
)
```

#### PRODUCT Tablosu (Superclass)
```sql
PRODUCT (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    release_date DATE,
    product_type VARCHAR(20) CHECK (product_type IN ('game', 'console')),
    brand VARCHAR(100),
    status VARCHAR(20),
    weight DECIMAL(6,2),
    dimensions VARCHAR(50),
    stock_alert_level INT DEFAULT 10
)
```

#### GAME Tablosu (Subclass)
```sql
GAME (
    product_id INT PRIMARY KEY REFERENCES PRODUCT(product_id) ON DELETE CASCADE,
    platform VARCHAR(255),
    developer VARCHAR(100),
    publisher VARCHAR(100),
    ESRB_rating VARCHAR(10),
    multiplayer BOOLEAN,
    language_support TEXT,
    subtitle_languages TEXT
)
```

#### CONSOLE Tablosu (Subclass)
```sql
CONSOLE (
    product_id INT PRIMARY KEY REFERENCES PRODUCT(product_id) ON DELETE CASCADE,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    storage_capacity VARCHAR(20),
    color VARCHAR(30),
    included_accessories TEXT,
    warranty_period INT
)
```

#### ORDER Tablosu
```sql
ORDER (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT REFERENCES CUSTOMER(customer_id) ON DELETE SET NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_status VARCHAR(20),
    total_amount DECIMAL(10,2),
    shipping_fee DECIMAL(6,2),
    payment_method VARCHAR(30),
    payment_status VARCHAR(20),
    tracking_number VARCHAR(50),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    delivery_full_address TEXT,
    delivery_city VARCHAR(100),
    billing_full_address TEXT,
    billing_city VARCHAR(100)
)
```

#### ORDER_DETAIL Tablosu (Weak Entity)
```sql
ORDER_DETAIL (
    order_id INT REFERENCES ORDER(order_id) ON DELETE CASCADE,
    line_no INT,
    product_id INT REFERENCES PRODUCT(product_id) ON DELETE SET NULL,
    quantity INT CHECK (quantity > 0),
    unit_price DECIMAL(10,2),
    PRIMARY KEY (order_id, line_no)
)
```

#### INVENTORY Tablosu
```sql
INVENTORY (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL REFERENCES PRODUCT(product_id) ON DELETE CASCADE,
    branch_id INT NOT NULL REFERENCES BRANCH(branch_id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity >= 0),
    minimum_stock INT DEFAULT 10,
    maximum_stock INT DEFAULT 100,
    shelf_location VARCHAR(50),
    last_update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (product_id, branch_id)
)
```

#### PURCHASE Tablosu (BCNF Uyumlu)
```sql
PURCHASE (
    purchase_id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT REFERENCES SUPPLIER(supplier_id) ON DELETE SET NULL,
    product_id INT REFERENCES PRODUCT(product_id) ON DELETE SET NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quantity INT CHECK (quantity > 0),
    unit_cost DECIMAL(10,2) CHECK (unit_cost > 0),
    payment_status VARCHAR(20),
    payment_date DATE,
    invoice_no VARCHAR(50)
)
-- NOT: total_cost = quantity × unit_cost, VIEW_PURCHASE_WITH_TOTAL ile hesaplanır
```

#### SALE Tablosu (BCNF Uyumlu)
```sql
SALE (
    sale_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT REFERENCES CUSTOMER(customer_id) ON DELETE SET NULL,
    order_id INT REFERENCES ORDER(order_id) ON DELETE SET NULL,
    branch_id INT REFERENCES BRANCH(branch_id) ON DELETE SET NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_amount DECIMAL(10,2),
    cost DECIMAL(10,2),
    sale_type VARCHAR(20) CHECK (sale_type IN ('online', 'in-store')),
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
-- NOT: profit = transaction_amount - cost, VIEW_SALE_WITH_PROFIT ile hesaplanır
```

### 4.3 Normalizasyon Analizi

**Tüm 19 tablo 1NF, 2NF, 3NF ve BCNF'e uygundur.**

#### 1NF (First Normal Form) ✓
- Tüm tablolarda atomik değerler kullanılmıştır
- Tekrarlayan gruplar elimine edilmiştir (örn: genres için GAME_GENRE tablosu)

#### 2NF (Second Normal Form) ✓
- Tüm tablolarda tam fonksiyonel bağımlılık sağlanmıştır
- ORDER_DETAIL tablosunda (order_id, line_no) → {product_id, quantity, unit_price}

#### 3NF (Third Normal Form) ✓
- Geçişli bağımlılıklar elimine edilmiştir
- PURCHASE ve SALE tablolarında türetilmiş sütunlar (total_cost, profit) kaldırılmış, VIEW'lar ile hesaplanmaktadır

#### BCNF (Boyce-Codd Normal Form) ✓
- Her fonksiyonel bağımlılıkta belirleyici (determinant) bir aday anahtardır
- Türetilmiş sütunlar (total_cost, profit) kaldırılarak BCNF ihlali önlenmiştir
- Bu değerler VIEW'lar aracılığıyla hesaplanmaktadır:
  - `VIEW_PURCHASE_WITH_TOTAL`: total_cost = quantity × unit_cost
  - `VIEW_SALE_WITH_PROFIT`: profit = transaction_amount - cost
- Tüm 19 tablo BCNF'dedir

### 4.4 İlişkisel Şema Diyagramı

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              GAME STORE DATABASE SCHEMA                           │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌──────────────┐                    ┌──────────────┐                            │
│  │   CUSTOMER   │                    │   SUPPLIER   │                            │
│  ├──────────────┤                    ├──────────────┤                            │
│  │ PK customer_id│                   │ PK supplier_id│                            │
│  │    email (UK) │                   │    supplier_name│                         │
│  │    password   │                   │    active_status│                         │
│  │    is_admin   │                   └───────┬──────┘                            │
│  └───────┬──────┘                            │                                   │
│          │                                   │ 1:N                               │
│          │ 1:N                               ▼                                   │
│          │                           ┌──────────────┐                            │
│  ┌───────┴──────┐                   │   PURCHASE   │                            │
│  │    ORDER     │                   ├──────────────┤                            │
│  ├──────────────┤                   │ PK purchase_id│                            │
│  │ PK order_id  │◄──────────────────│ FK supplier_id│                            │
│  │ FK customer_id│                   │ FK product_id │────┐                      │
│  │    status    │                   │    quantity   │    │                      │
│  └───────┬──────┘                   └──────────────┘    │                      │
│          │                                              │                      │
│          │ 1:N                                          │                      │
│          ▼                                              │                      │
│  ┌──────────────┐     ┌──────────────┐                 │                      │
│  │ ORDER_DETAIL │     │   PRODUCT    │◄────────────────┘                      │
│  ├──────────────┤     ├──────────────┤                                        │
│  │ PK order_id  │     │ PK product_id│                                        │
│  │ PK line_no   │     │    price     │                                        │
│  │ FK product_id│────►│    type      │                                        │
│  │    quantity  │     └───────┬──────┘                                        │
│  └──────────────┘             │                                                │
│                               │ ISA                                            │
│                      ┌────────┼────────┐                                       │
│                      ▼        │        ▼                                       │
│              ┌──────────┐     │  ┌──────────┐                                  │
│              │   GAME   │     │  │ CONSOLE  │                                  │
│              ├──────────┤     │  ├──────────┤                                  │
│              │PK/FK prod│     │  │PK/FK prod│                                  │
│              │ platform │     │  │manufacturer│                                │
│              │ ESRB     │     │  │ storage  │                                  │
│              └────┬─────┘     │  └──────────┘                                  │
│                   │           │                                                │
│                   │ M:N       │                                                │
│                   ▼           │                                                │
│              ┌──────────┐     │  ┌──────────────┐      ┌──────────────┐       │
│              │GAME_GENRE│     │  │  INVENTORY   │      │    BRANCH    │       │
│              ├──────────┤     │  ├──────────────┤      ├──────────────┤       │
│              │PK prod_id│     └─►│ PK inventory │      │ PK branch_id │       │
│              │PK genre_id│       │ FK product_id│      │    name      │◄──────┤
│              └────┬─────┘       │ FK branch_id │──────►│    manager   │       │
│                   │             │    quantity  │      └──────────────┘       │
│                   ▼             └──────────────┘                              │
│              ┌──────────┐                                                      │
│              │   GENRE  │                                                      │
│              ├──────────┤                                                      │
│              │PK genre_id│                                                     │
│              │   name   │                                                      │
│              └──────────┘                                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Tasarımın Uyarlanması

### 5.1 Yazılım/Donanım Ortamı ve VTYS Bilgileri

#### Seçilen Teknolojiler

| Katman | Teknoloji | Versiyon | Açıklama |
|--------|-----------|----------|----------|
| **Veritabanı (VTYS)** | MySQL | 8.0+ | İlişkisel veritabanı yönetim sistemi |
| **Backend** | Python Flask | 3.1.2 | RESTful API sunucusu |
| **Frontend** | React.js | 18.x | Tek sayfa web uygulaması |
| **DB Connector** | mysql-connector-python | 9.5.0 | Python MySQL bağlayıcısı (ODBC/JDBC alternatifi) |
| **HTTP Client** | Axios | - | Frontend-Backend iletişimi |

#### Mimari (3-Tier Architecture)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
│                          (React Frontend)                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ - Home Page          - Product Listing    - Product Detail     │ │
│  │ - Shopping Cart      - Checkout           - Orders             │ │
│  │ - User Profile       - Admin Dashboard    - Inventory Manager  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                           HTTP/REST API                              │
│                                  ▼                                   │
├─────────────────────────────────────────────────────────────────────┤
│                        APPLICATION LAYER                            │
│                         (Flask Backend)                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ API Endpoints:                                                 │ │
│  │ - /api/products      - /api/cart          - /api/orders        │ │
│  │ - /api/customers     - /api/reviews       - /api/admin/*       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                    mysql-connector-python                            │
│                                  ▼                                   │
├─────────────────────────────────────────────────────────────────────┤
│                           DATA LAYER                                │
│                            (MySQL)                                  │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Database: oyun_satis_db                                        │ │
│  │ Tables: 19 tables + Views + Triggers                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Tabloların Oluşturulması

Tüm tablolar `database/dbsetup.sql` dosyasında tanımlanmıştır. Aşağıda temel DDL komutları verilmektedir:

```sql
-- Veritabanı Oluşturma
CREATE DATABASE IF NOT EXISTS oyun_satis_db DEFAULT CHARACTER SET 'utf8mb4';
USE oyun_satis_db;

-- CUSTOMER Tablosu
CREATE TABLE IF NOT EXISTS `CUSTOMER` (
  `customer_id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `registration_date` DATE,
  `last_login_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active_status` BOOLEAN DEFAULT TRUE,
  `is_admin` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `uk_email` (`email`)
);

-- PRODUCT Tablosu (Superclass)
CREATE TABLE IF NOT EXISTS `PRODUCT` (
  `product_id` INT NOT NULL AUTO_INCREMENT,
  `product_name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `release_date` DATE,
  `product_type` VARCHAR(20),
  `brand` VARCHAR(100),
  `status` VARCHAR(20),
  `weight` DECIMAL(6, 2),
  `dimensions` VARCHAR(50),
  `stock_alert_level` INT DEFAULT 10,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `chk_price` CHECK (`price` > 0),
  CONSTRAINT `chk_product_type` CHECK (`product_type` IN ('game', 'console'))
);

-- GAME Tablosu (Subclass)
CREATE TABLE IF NOT EXISTS `GAME` (
  `product_id` INT NOT NULL,
  `platform` VARCHAR(255),
  `developer` VARCHAR(100),
  `publisher` VARCHAR(100),
  `ESRB_rating` VARCHAR(10),
  `multiplayer` BOOLEAN,
  `language_support` TEXT,
  `subtitle_languages` TEXT,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_game_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE
);

-- CONSOLE Tablosu (Subclass)
CREATE TABLE IF NOT EXISTS `CONSOLE` (
  `product_id` INT NOT NULL,
  `manufacturer` VARCHAR(100),
  `model` VARCHAR(100),
  `storage_capacity` VARCHAR(20),
  `color` VARCHAR(30),
  `included_accessories` TEXT,
  `warranty_period` INT,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_console_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE
);

-- ORDER Tablosu
CREATE TABLE IF NOT EXISTS `ORDER` (
  `order_id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT,
  `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `order_status` VARCHAR(20),
  `total_amount` DECIMAL(10, 2),
  `shipping_fee` DECIMAL(6, 2),
  `payment_method` VARCHAR(30),
  `payment_status` VARCHAR(20),
  `tracking_number` VARCHAR(50),
  `estimated_delivery_date` DATE,
  `actual_delivery_date` DATE,
  `delivery_full_address` TEXT,
  `delivery_city` VARCHAR(100),
  `billing_full_address` TEXT,
  `billing_city` VARCHAR(100),
  PRIMARY KEY (`order_id`),
  CONSTRAINT `fk_order_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)
    ON DELETE SET NULL
);

-- ORDER_DETAIL Tablosu (Weak Entity)
CREATE TABLE IF NOT EXISTS `ORDER_DETAIL` (
  `order_id` INT NOT NULL,
  `line_no` INT NOT NULL,
  `product_id` INT,
  `quantity` INT,
  `unit_price` DECIMAL(10, 2),
  PRIMARY KEY (`order_id`, `line_no`),
  CONSTRAINT `fk_od_order`
    FOREIGN KEY (`order_id`) REFERENCES `ORDER` (`order_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_od_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_od_quantity` CHECK (`quantity` > 0)
);

-- INVENTORY Tablosu
CREATE TABLE IF NOT EXISTS `INVENTORY` (
  `inventory_id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `minimum_stock` INT DEFAULT 10,
  `maximum_stock` INT DEFAULT 100,
  `shelf_location` VARCHAR(50),
  `last_update_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `uk_product_branch` (`product_id`, `branch_id`),
  CONSTRAINT `fk_inv_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_inv_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `BRANCH` (`branch_id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_quantity` CHECK (`quantity` >= 0)
);
```

### 5.3 Görünümler (Views)

Sistemde **5 adet VIEW** tanımlanmıştır (3 raporlama + 2 BCNF uyumluluk):

#### VIEW 1: VIEW_PRODUCT_DETAILS
Tüm ürün detaylarını (Game ve Console) birleştirir:

```sql
CREATE OR REPLACE VIEW VIEW_PRODUCT_DETAILS AS
SELECT 
    p.product_id,
    p.product_name,
    p.price,
    p.product_type,
    p.brand,
    p.status,
    g.platform,
    g.developer,
    g.ESRB_rating,
    c.manufacturer,
    c.storage_capacity,
    c.color
FROM PRODUCT p
LEFT JOIN GAME g ON p.product_id = g.product_id
LEFT JOIN CONSOLE c ON p.product_id = c.product_id;
```

#### VIEW 2: VIEW_ORDER_SUMMARY
Admin paneli için sipariş özeti:

```sql
CREATE OR REPLACE VIEW VIEW_ORDER_SUMMARY AS
SELECT 
    o.order_id,
    o.order_date,
    o.order_status,
    o.total_amount,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.email,
    COUNT(od.line_no) as item_count
FROM `ORDER` o
JOIN CUSTOMER c ON o.customer_id = c.customer_id
LEFT JOIN ORDER_DETAIL od ON o.order_id = od.order_id
GROUP BY o.order_id;
```

#### VIEW 3: VIEW_LOW_STOCK
Kritik stok seviyesindeki ürünler:

```sql
CREATE OR REPLACE VIEW VIEW_LOW_STOCK AS
SELECT 
    i.inventory_id,
    p.product_name,
    b.branch_name,
    i.quantity,
    i.minimum_stock
FROM INVENTORY i
JOIN PRODUCT p ON i.product_id = p.product_id
JOIN BRANCH b ON i.branch_id = b.branch_id
WHERE i.quantity <= i.minimum_stock;
```

#### VIEW 4: VIEW_PURCHASE_WITH_TOTAL (BCNF Uyumluluk)
PURCHASE tablosu için hesaplanmış total_cost sütunu:

```sql
CREATE OR REPLACE VIEW VIEW_PURCHASE_WITH_TOTAL AS
SELECT 
    purchase_id,
    supplier_id,
    product_id,
    transaction_date,
    quantity,
    unit_cost,
    (quantity * unit_cost) AS total_cost,
    payment_status,
    payment_date,
    invoice_no
FROM PURCHASE;
```

#### VIEW 5: VIEW_SALE_WITH_PROFIT (BCNF Uyumluluk)
SALE tablosu için hesaplanmış profit sütunu:

```sql
CREATE OR REPLACE VIEW VIEW_SALE_WITH_PROFIT AS
SELECT 
    sale_id,
    customer_id,
    order_id,
    branch_id,
    transaction_date,
    transaction_amount,
    cost,
    (transaction_amount - cost) AS profit,
    sale_type,
    sale_date
FROM SALE;
```

### 5.4 İndeksler (Indexes)

Sorgu performansı için oluşturulan indeksler:

```sql
-- Ürün aramaları için
CREATE INDEX idx_product_name ON PRODUCT(product_name);
CREATE INDEX idx_product_price ON PRODUCT(price);
CREATE INDEX idx_product_type ON PRODUCT(product_type);

-- Sipariş sorguları için
CREATE INDEX idx_order_date ON `ORDER`(order_date);
CREATE INDEX idx_order_customer ON `ORDER`(customer_id);

-- Oyun filtreleme için
CREATE INDEX idx_game_rating ON GAME(ESRB_rating);
```

### 5.5 Tetikleyiciler (Triggers)

#### Stok Değişiklik Logu Trigger'ı

```sql
-- STOCK_LOG Tablosu
CREATE TABLE IF NOT EXISTS `STOCK_LOG` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `old_quantity` INT,
  `new_quantity` INT,
  `change_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  CONSTRAINT `fk_log_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_log_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `BRANCH` (`branch_id`)
    ON DELETE CASCADE
);

-- Trigger: Stok değişikliğinde otomatik loglama
DELIMITER //
CREATE TRIGGER after_inventory_update
AFTER UPDATE ON INVENTORY
FOR EACH ROW
BEGIN
    IF OLD.quantity != NEW.quantity THEN
        INSERT INTO STOCK_LOG (product_id, branch_id, old_quantity, new_quantity, change_date)
        VALUES (NEW.product_id, NEW.branch_id, OLD.quantity, NEW.quantity, NOW());
    END IF;
END//
DELIMITER ;
```

### 5.6 Veri Yükleme

#### Veri Kaynakları

| Veri Tipi | Kaynak | Açıklama |
|-----------|--------|----------|
| **Oyunlar** | IGDB API | Gerçek oyun verileri (isim, açıklama, platform, görsel) |
| **Konsollar** | IGDB API + Manuel | Konsol bilgileri ve görselleri (Wikimedia) |
| **Türler** | IGDB API | Oyun türleri |
| **Sentetik Veriler** | Faker (Python) | Müşteri, sipariş, yorum, adres vb. |

#### ETL Süreci

1. **Extract**: IGDB API'den oyun ve konsol verileri çekilir (`dataload.py`)
2. **Transform**: Veriler veritabanı şemasına uygun formata dönüştürülür
3. **Load**: MySQL veritabanına yüklenir

```python
# dataload.py - Örnek ETL Kodu
def load_games(cnx, cursor, igdb_genre_map):
    """Oyunları IGDB'den çeker ve veritabanına yükler"""
    
    api_sorgusu = (
        "fields name, summary, first_release_date, "
        "platforms.name, genres, "
        "involved_companies.company.name, "
        "cover.url, screenshots.url; "
        "where platforms = (48, 49, 130, 6); "
        "limit 50;"
    )
    
    byte_array = wrapper.api_request("games", api_sorgusu)
    games_list = json.loads(byte_array)
    
    for game in games_list:
        # PRODUCT tablosuna ekle
        cursor.execute(query_product, (game_name, description, ...))
        product_id = cursor.lastrowid
        
        # GAME tablosuna ekle
        cursor.execute(query_game, (product_id, platform, developer, ...))
        
        # GAME_GENRE ilişkilerini ekle
        for genre_id in game["genres"]:
            cursor.execute(query_game_genre, (product_id, genre_id))
```

#### Sentetik Veri Üretimi

```python
# generate_synthetic_data.py - Konfigürasyon
NUM_CUSTOMERS = 200
NUM_SUPPLIERS = 15
NUM_BRANCHES = 5
NUM_ORDERS = 250
NUM_REVIEWS = 300
NUM_PURCHASES = 100
NUM_RETURNS = 30
```

### 5.7 Sorgu Tasarımları

#### Sorgu 1: Ürün Listeleme (Filtreli + Sayfalı)
```sql
SELECT p.product_id, p.product_name, p.price, p.product_type, p.release_date,
       MAX(pm.media_url) as main_image,
       COALESCE(AVG(r.rating), 0) as avg_rating
FROM PRODUCT p
LEFT JOIN PRODUCT_MEDIA pm ON p.product_id = pm.product_id AND pm.main_image = TRUE
LEFT JOIN REVIEW r ON p.product_id = r.product_id
LEFT JOIN GAME gm ON p.product_id = gm.product_id
WHERE p.product_type = 'game'
  AND gm.platform REGEXP '(^|, )PlayStation 5($|,)'
  AND p.price BETWEEN 20 AND 100
GROUP BY p.product_id
HAVING avg_rating >= 4.0
ORDER BY p.release_date DESC
LIMIT 24 OFFSET 0;
```

#### Sorgu 2: Sipariş Detayları ile Müşteri Siparişleri
```sql
SELECT 
    o.order_id,
    o.order_date,
    o.order_status,
    o.total_amount,
    od.product_id,
    od.quantity,
    od.unit_price,
    p.product_name,
    pm.media_url as image_url
FROM `ORDER` o
JOIN ORDER_DETAIL od ON o.order_id = od.order_id
JOIN PRODUCT p ON od.product_id = p.product_id
LEFT JOIN PRODUCT_MEDIA pm ON p.product_id = pm.product_id AND pm.main_image = TRUE
WHERE o.customer_id = ?
ORDER BY o.order_date DESC;
```

#### Sorgu 3: Analitik - Net Gelir ve Kar Hesaplama
```sql
SELECT 
    COALESCE(SUM(s.transaction_amount), 0) - 
    COALESCE((
        SELECT SUM(r.refund_amount) 
        FROM `RETURN` r
        WHERE r.return_status = 'completed'
    ), 0) as total_revenue,
    COALESCE(SUM(s.profit), 0) - 
    COALESCE((
        SELECT SUM(r.refund_amount) 
        FROM `RETURN` r
        WHERE r.return_status = 'completed'
    ), 0) as total_profit,
    COUNT(s.sale_id) as total_transactions
FROM SALE s
JOIN `ORDER` o ON s.order_id = o.order_id
WHERE o.order_status != 'cancelled';
```

#### Sorgu 4: En Çok Satan Ürünler
```sql
SELECT 
    p.product_name,
    SUM(od.quantity) - COALESCE((
        SELECT SUM(r.quantity) 
        FROM `RETURN` r 
        WHERE r.product_id = p.product_id 
        AND r.return_status = 'completed'
    ), 0) as total_sold,
    SUM(od.quantity * od.unit_price) as revenue
FROM ORDER_DETAIL od
JOIN PRODUCT p ON od.product_id = p.product_id
JOIN `ORDER` o ON od.order_id = o.order_id
WHERE o.order_status != 'cancelled'
GROUP BY p.product_id, p.product_name
ORDER BY total_sold DESC
LIMIT 5;
```

#### Sorgu 5: Şube Performans Karşılaştırması
```sql
SELECT 
    b.branch_name,
    COUNT(s.sale_id) as transaction_count,
    COALESCE(SUM(s.transaction_amount), 0) as revenue,
    COALESCE(SUM(s.profit), 0) as profit
FROM BRANCH b
LEFT JOIN SALE s ON b.branch_id = s.branch_id
JOIN `ORDER` o ON s.order_id = o.order_id
WHERE o.order_status != 'cancelled'
GROUP BY b.branch_id, b.branch_name
ORDER BY revenue DESC;
```

---

## 6. Uygulama Programı Tanıtımı ve Örnek Kullanım

### 6.1 Kurulum ve Çalıştırma

#### Gereksinimler
- Python 3.x
- Node.js ve npm
- MySQL 8.0+

#### Kurulum Adımları

```bash
# 1. Repository'yi klonlayın
git clone <repository-url>
cd gameD0NTst0p

# 2. Python bağımlılıklarını yükleyin
pip install -r requirements.txt

# 3. .env dosyasını oluşturun
cp .env_example .env
# .env dosyasını düzenleyin ve veritabanı bilgilerini girin

# 4. Veritabanını oluşturun
mysql -u root -p < database/dbsetup.sql

# 5. Verileri yükleyin
cd database
python dataload.py
python generate_synthetic_data.py
cd ..

# 6. Backend'i başlatın
python app.py

# 7. Yeni terminal açın ve Frontend'i başlatın
cd frontend
npm install
npm start
```

### 6.2 Uygulama Ekran Görüntüleri ve Özellikleri

#### Ana Sayfa (Home)
- Öne çıkan oyunlar ve konsollar
- Hızlı erişim butonları
- Retro/pixel-art temalı modern tasarım

#### Ürün Listeleme (Products)
- Grid görünümde ürün kartları
- Filtreleme seçenekleri:
  - Ürün tipi (Game/Console)
  - Tür (Genre)
  - Platform
  - Fiyat aralığı
  - ESRB derecesi
  - Multiplayer özelliği
- Sıralama seçenekleri (Fiyat, Tarih, Rating)
- Sayfalama

#### Ürün Detay (Product Detail)
- Ürün görselleri galeri
- Detaylı bilgiler (platform, developer, ESRB vb.)
- Stok durumu ve mevcut şubeler
- Müşteri yorumları ve puanları
- Sepete ekleme butonu

#### Alışveriş Sepeti (Cart)
- Sepetteki ürünler listesi
- Miktar güncelleme
- Ürün silme
- Toplam fiyat hesaplama
- Ödeme sayfasına geçiş

#### Ödeme (Checkout)
- Teslimat adresi seçimi
- Fatura adresi
- Ödeme yöntemi seçimi
- Sipariş özeti
- Sipariş onayı

#### Siparişlerim (Orders)
- Sipariş geçmişi
- Sipariş durumu takibi
- Kargo takip numarası
- İade talebi oluşturma

#### Profil (Profile)
- Kişisel bilgiler düzenleme
- Şifre değiştirme
- Adres yönetimi

### 6.3 Admin Paneli

#### Dashboard
- Toplam satış tutarı
- Sipariş sayısı
- Ürün sayısı
- Düşük stok uyarıları

#### Envanter Yönetimi (Inventory Manager)
- Tüm ürünlerin stok durumu
- Şube bazlı filtreleme
- Stok yenileme (Restock)
- Şubeler arası transfer
- Mağaza içi satış kaydı
- Stok değişiklik logları

#### Sipariş Yönetimi (Order Manager)
- Tüm siparişlerin listesi
- Durum güncelleme (pending → shipped → delivered)
- Sipariş detayları görüntüleme
- İptal ve iade işlemleri

#### İade Yönetimi (Returns)
- İade talepleri listesi
- Onaylama/Reddetme
- İade tamamlama

#### Analitik (Analytics)
- Toplam gelir ve kar
- Şube performans karşılaştırması
- En çok satan ürünler

#### Şubeler (Branches)
- Şube bilgileri listesi
- Şube bazlı envanter görünümü

### 6.4 API Endpoint'leri

#### Ürün API'leri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/products | Ürün listesi (filtreli + sayfalı) |
| GET | /api/products/:id | Ürün detayı |
| GET | /api/genres | Tür listesi |
| GET | /api/platforms | Platform listesi |

#### Müşteri API'leri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/customers/register | Kayıt |
| POST | /api/customers/login | Giriş |
| GET | /api/profile | Profil bilgileri |
| PUT | /api/profile/update | Profil güncelleme |
| PUT | /api/profile/password | Şifre değiştirme |

#### Sepet API'leri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/cart/:customer_id | Sepet içeriği |
| POST | /api/cart | Sepete ekle |
| DELETE | /api/cart/:customer_id/:product_id | Sepetten çıkar |

#### Sipariş API'leri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/orders | Sipariş oluştur |
| GET | /api/orders/:customer_id | Müşteri siparişleri |
| PUT | /api/orders/:order_id/status | Durum güncelle |

#### Admin API'leri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/admin/stats | Dashboard istatistikleri |
| GET | /api/admin/inventory | Envanter listesi |
| GET | /api/admin/orders | Tüm siparişler (VIEW kullanır) |
| GET | /api/admin/analytics | Analitik veriler |
| POST | /api/admin/restock | Stok yenileme |
| POST | /api/admin/inventory/transfer | Stok transferi |
| POST | /api/admin/sales/offline | Mağaza içi satış |
| GET | /api/admin/returns | İade listesi |
| PUT | /api/admin/returns/:id/status | İade durumu güncelle |

### 6.5 Örnek Kullanım Senaryoları

#### Senaryo 1: Müşteri Oyun Satın Alma
1. Müşteri siteye giriş yapar
2. "Products" sayfasına gider
3. Filtreleme: Type=Game, Platform=PlayStation 5
4. İstediği oyunu seçer ve detay sayfasını görür
5. "Add to Cart" butonuna tıklar
6. Sepet sayfasına gider
7. "Checkout" butonuna tıklar
8. Teslimat adresini seçer
9. Ödeme yöntemini seçer
10. Siparişi onaylar
11. Sipariş durumunu "My Orders" sayfasından takip eder

#### Senaryo 2: Admin Stok Yönetimi
1. Admin hesabıyla giriş yapar
2. Admin paneline erişir
3. "Inventory" sayfasına gider
4. Düşük stoklu ürünü bulur
5. "Restock" butonuna tıklar
6. Tedarikçi, miktar ve birim maliyet girer
7. Stok yenilenir ve STOCK_LOG'a kayıt düşer

#### Senaryo 3: İade İşlemi
1. Müşteri "My Orders" sayfasına gider
2. Teslim edilmiş siparişte "Request Return" tıklar
3. İade nedenini girer
4. Admin panelinde "Returns" sayfasına gelir
5. İade talebini inceler
6. "Approve" veya "Reject" seçer
7. Onaylanırsa "Complete" ile tamamlar
8. Stok otomatik olarak geri eklenir

---

## 7. Sonuç

### 7.1 Proje Özeti

Bu projede, BIL372 Veritabanı Sistemleri dersi kapsamında kapsamlı bir B2C e-ticaret platformu geliştirilmiştir. Proje, fiziksel video oyunu ve konsol satışı yapan bir online mağazayı simüle etmektedir.

### 7.2 Uygulanan Veritabanı Kavramları

| Kavram | Uygulama |
|--------|----------|
| **Superclass/Subclass** | PRODUCT → GAME, CONSOLE |
| **Weak Entity** | ORDER_DETAIL (ORDER'a bağımlı) |
| **Associative Entity** | GAME_GENRE, CART |
| **Composite Attributes** | Teslimat ve fatura adresleri |
| **Foreign Keys** | 15+ ilişki |
| **CHECK Constraints** | price > 0, quantity >= 0, rating 1-5 |
| **UNIQUE Constraints** | email, (product_id, branch_id) |
| **Views** | 5 adet (3 raporlama + 2 BCNF uyumluluk) |
| **Indexes** | 6 adet performans indeksi |
| **Triggers** | Stok değişiklik logu |
| **Transactions** | Sipariş oluşturma, stok güncelleme |
| **Normalization** | Tüm tablolar 1NF, 2NF, 3NF ve BCNF |

### 7.3 Teknik Başarılar

1. **3-Katmanlı Mimari**: Presentation, Application, Data katmanları ayrıldı
2. **RESTful API**: 30+ endpoint ile tam CRUD operasyonları
3. **IGDB Entegrasyonu**: Gerçek oyun verileri ile zenginleştirilmiş katalog
4. **Sentetik Veri**: Faker kütüphanesi ile 1000+ kayıt
5. **Admin Paneli**: Kapsamlı yönetim araçları
6. **Responsive Tasarım**: Modern ve kullanıcı dostu arayüz

### 7.4 Karşılaşılan Zorluklar ve Çözümler

| Zorluk | Çözüm |
|--------|-------|
| IGDB API veri tutarsızlığı | Sentetik veri ile tamamlama |
| Stok yönetimi karmaşıklığı | Transaction ve Trigger kullanımı |
| M:N ilişki yönetimi | Associative entity tabloları |
| Performans optimizasyonu | İndeksler ve View'lar |

### 7.5 Gelecek Geliştirmeler

- [ ] Gerçek ödeme entegrasyonu (Stripe, PayPal)
- [ ] E-posta bildirimleri
- [ ] Wishlist özelliği
- [ ] Ürün karşılaştırma
- [ ] Gelişmiş arama (full-text search)
- [ ] Mobile uygulama
- [ ] Chatbot desteği

---

## 8. Referanslar

1. **IGDB API Documentation** - https://api-docs.igdb.com/
2. **MySQL 8.0 Reference Manual** - https://dev.mysql.com/doc/refman/8.0/en/
3. **Flask Documentation** - https://flask.palletsprojects.com/
4. **React Documentation** - https://react.dev/
5. **Faker Python Library** - https://faker.readthedocs.io/
6. **mysql-connector-python** - https://dev.mysql.com/doc/connector-python/en/
7. **Axios HTTP Client** - https://axios-http.com/
8. **Elmasri & Navathe, "Fundamentals of Database Systems"** - 7th Edition

---

## Ekler

### Ek A: Ara Rapor ile Farklılıklar

Uygulama sürecinde ara rapordan bazı farklılıklar oluşmuştur:

| Ara Rapor | Uygulama | Açıklama |
|-----------|----------|----------|
| CUSTOMER tablosu | is_admin eklendi | Admin yetkilendirmesi için |
| ORDER address | Inline sütunlar | Composite yerine ayrı sütunlar |
| BRANCH address_id | Korundu | FK olarak ADDRESS'e bağlı |
| - | STOCK_LOG tablosu | Trigger için log tablosu |
| PURCHASE.total_cost | Kaldırıldı | BCNF uyumluluğu - VIEW ile hesaplanır |
| SALE.profit | Kaldırıldı | BCNF uyumluluğu - VIEW ile hesaplanır |
| - | VIEW_PURCHASE_WITH_TOTAL | total_cost = quantity × unit_cost |
| - | VIEW_SALE_WITH_PROFIT | profit = transaction_amount - cost |

**BCNF Uyumluluk Notu:** Ara raporda PURCHASE ve SALE tablolarında bulunan türetilmiş sütunlar (total_cost, profit) 3NF/BCNF ihlali oluşturuyordu. Bu sütunlar kaldırılmış ve yerine VIEW'lar oluşturulmuştur. Böylece tüm tablolar 1NF, 2NF, 3NF ve BCNF'e tam uyumlu hale getirilmiştir.

Bu farklılıklar, uygulama geliştirme sürecinde ortaya çıkan pratik ihtiyaçlardan ve normalizasyon gereksinimlerinden kaynaklanmaktadır.

### Ek B: Dosya Yapısı

```
gameD0NTst0p/
├── app.py                      # Flask Backend (2100+ satır)
├── requirements.txt            # Python bağımlılıkları
├── .env_example                # Örnek çevre değişkenleri
├── run_project.bat             # Otomatik başlatma scripti
├── README.md                   # Proje açıklaması
│
├── database/
│   ├── dbsetup.sql             # Tablo oluşturma DDL
│   ├── dataload.py             # IGDB'den veri çekme (ETL)
│   ├── generate_synthetic_data.py  # Faker ile veri üretme
│   ├── igdb_service.py         # IGDB API wrapper
│   └── init_db.py              # Veritabanı başlatma
│
├── frontend/
│   ├── package.json            # React bağımlılıkları
│   ├── public/                 # Statik dosyalar
│   └── src/
│       ├── App.js              # Ana uygulama
│       ├── context/            # Auth context
│       ├── components/         # UI bileşenleri
│       ├── pages/              # Sayfa bileşenleri
│       │   ├── Home.js
│       │   ├── Products.js
│       │   ├── ProductDetail.js
│       │   ├── Cart.js
│       │   ├── Checkout.js
│       │   ├── Orders.js
│       │   ├── Profile.js
│       │   └── admin/
│       │       ├── AdminDashboard.js
│       │       ├── InventoryManager.js
│       │       ├── OrderManager.js
│       │       ├── Analytics.js
│       │       ├── Branches.js
│       │       └── Returns.js
│       └── services/
│           └── api.js          # API çağrıları
│
└── reports/
    ├── Proje Tanimi.md         # Proje gereksinimleri
    └── *_AraRapor.pdf          # Ara rapor
```
