# Game Store Project

## Nasıl Çalıştırılır

Bu proje Backend (Flask) ve Frontend (React) olmak üzere iki parçadan oluşur.

### Otomatik Çalıştırma
Ana dizindeki `run_project.bat` dosyasına çift tıklayarak veya terminalden çalıştırarak her ikisini de başlatabilirsiniz.

### Manuel Çalıştırma

1. **Backend'i Başlatma:**
   Terminalde ana dizindeyken:
   ```bash
   python app.py
   ```
   Backend http://localhost:5000 adresinde çalışacaktır.

2. **Frontend'i Başlatma:**
   Yeni bir terminal açın ve frontend dizinine gidin:
   ```bash
   cd frontend
   npm start
   ```
   Frontend http://localhost:3000 adresinde açılacaktır.

## Gereksinimler

- Python 3.x
- Node.js ve npm
- MySQL Veritabanı (yapılandırılmış .env dosyası ile)
