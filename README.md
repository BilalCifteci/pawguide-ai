# 🐾 PawGuide AI

**Yapay zekâ tabanlı evcil hayvan sağlık ve beslenme yönetim platformu**

[![CI/CD](https://github.com/yourusername/pawguide-ai/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/pawguide-ai/actions)

---

## 📐 Mimari

```
Client (Next.js 14)
      ↓
Nginx (SSL + Rate Limiting)
      ↓
FastAPI (Python 3.12)  ←→  Celery Workers
      ↓                          ↓
PostgreSQL + Redis         ML Models (XGBoost/LightGBM)
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Docker & Docker Compose
- Git

### 1. Projeyi klonla
```bash
git clone https://github.com/yourusername/pawguide-ai.git
cd pawguide-ai
```

### 2. Environment dosyasını oluştur
```bash
cp .env.example .env
# .env dosyasını düzenle — SECRET_KEY ve NEXTAUTH_SECRET mutlaka değiştir!
```

### 3. SSL sertifikası (development için self-signed)
```bash
mkdir -p docker/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/key.pem \
  -out docker/nginx/ssl/cert.pem \
  -subj "/CN=localhost"
```

### 4. Başlat
```bash
docker compose up -d
```

### 5. Veritabanı migration
```bash
docker compose exec backend alembic upgrade head
```

### 6. Erişim
| Servis | URL |
|--------|-----|
| Frontend | https://localhost |
| API Docs | https://localhost/api/docs |
| Health Check | https://localhost/health |

---

## 📁 Proje Yapısı

```
pawguide-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # FastAPI route handlers
│   │   ├── core/               # Config, security, logging
│   │   ├── db/                 # SQLAlchemy session, base
│   │   ├── ml/                 # AI/ML modülleri
│   │   │   ├── nutrition_engine.py   # FEDIAF hesaplamaları
│   │   │   └── anomaly_detector.py  # Isolation Forest
│   │   ├── models/             # SQLAlchemy ORM modelleri
│   │   ├── schemas/            # Pydantic şemaları
│   │   ├── services/           # Business logic
│   │   └── worker/             # Celery görevleri
│   ├── alembic/                # DB migration'ları
│   └── tests/                  # Pytest testleri
│
├── frontend/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── auth/               # Login, Register
│   │   ├── dashboard/          # Ana panel
│   │   ├── pets/               # Hayvan CRUD + detay
│   │   ├── supply-chain/       # Barkod doğrulama
│   │   └── subscription/       # Akıllı abonelik
│   ├── components/             # Paylaşılan bileşenler
│   └── lib/api.ts              # Axios API istemcisi
│
├── docker/
│   ├── nginx/nginx.conf        # Reverse proxy
│   └── postgres/init.sql       # DB init
│
└── .github/workflows/ci-cd.yml # GitHub Actions
```

---

## 🧪 Testler

```bash
# Backend testleri
cd backend
pip install -r requirements.txt
pytest tests/ -v

# Frontend tip kontrolü
cd frontend
npm install
npm run type-check
```

---

## 🔑 API Endpointleri

### Auth
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/auth/register` | Kayıt |
| POST | `/api/v1/auth/login` | Giriş |
| POST | `/api/v1/auth/refresh` | Token yenile |

### Pets
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/pets/` | Tüm hayvanlar |
| POST | `/api/v1/pets/` | Hayvan ekle |
| GET | `/api/v1/pets/{id}` | Hayvan detay |
| PATCH | `/api/v1/pets/{id}` | Güncelle |
| DELETE | `/api/v1/pets/{id}` | Sil |
| POST | `/api/v1/pets/{id}/weight-logs` | Ağırlık kaydet |

### Nutrition
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/nutrition/requirements/{pet_id}` | FEDIAF ihtiyaçları |
| POST | `/api/v1/nutrition/score-food` | Mama skoru |
| GET | `/api/v1/nutrition/plans/{pet_id}` | Beslenme planları |

### Analytics
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/analytics/health-alerts/{pet_id}` | Sağlık uyarıları |
| GET | `/api/v1/analytics/summary/{pet_id}` | Ağırlık özeti |

### Supply Chain
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/supply-chain/verify/barcode` | Barkod doğrula |
| POST | `/api/v1/supply-chain/verify/qr` | QR doğrula |

---

## ⚙️ VPS Deployment

```bash
# Sunucuda:
apt update && apt install docker.io docker-compose-plugin git -y
git clone https://github.com/yourusername/pawguide-ai.git /opt/pawguide-ai
cd /opt/pawguide-ai
cp .env.example .env
# .env düzenle
docker compose up -d
docker compose exec backend alembic upgrade head
```

GitHub Secrets'a ekle:
- `VPS_HOST` — sunucu IP/domain
- `VPS_USER` — SSH kullanıcısı
- `VPS_SSH_KEY` — private SSH anahtarı

---

## 🧠 AI/ML Detayları

### Nutrition Engine (`app/ml/nutrition_engine.py`)
- FEDIAF 2021 standartlarına göre RER ve MER hesabı
- Tür, ırk, yaş, kısırlaştırma, aktivite faktörleri
- Mama skoru (kalori, protein, yağ kapsamı + alerjen cezası)

### Anomaly Detector (`app/ml/anomaly_detector.py`)
- **Rule-based**: %10 kazanım / %8 kayıp eşiği
- **Statistical**: Isolation Forest (n=100, contamination=5%)
- Celery ile haftalık yeniden eğitim
- `predict_consumption_rate()`: linear regression ile stok bitişini tahmin eder

---

## 📦 Geliştirme

```bash
# Backend (hot reload)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (hot reload)
cd frontend
npm install
npm run dev

# Celery worker
celery -A app.worker.celery_app worker --loglevel=info
```

---

## 📄 Lisans

MIT — Bilal Çifteci & PawGuide AI Ekibi
