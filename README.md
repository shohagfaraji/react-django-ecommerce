# 🛍️ VoltEdge — Full-Stack E-Commerce Platform

VoltEdge is a full-stack e-commerce web app with a React frontend and a Django REST Framework backend. It includes JWT-based authentication, a time-windowed seasonal discount engine, product comparison, and a real-time cart — built and deployed end-to-end (Netlify + Render).

**Live demo:** https://evoltedge.netlify.app  
**Backend API:** https://react-django-ecommerce-3cfu.onrender.com

> **Note:** The project uses Supabase's free-tier PostgreSQL database. If the database is paused or expires due to free-tier limitations (In rare cases), some API requests may fail and the application may display messages such as **"Failed to fetch products."**

---

## ✨ Features

- **Authentication** — JWT-based signup/login with access + refresh tokens (SimpleJWT), protected checkout route
- **Product catalog** — category filtering, full-text search across name/description/category, new arrivals feed
- **Seasonal discount engine** — admin-configurable offer banners (Eid, Winter, Summer, Monsoon, Puja, Default themes) with a live countdown timer; discounts are only active during the exact `event_start` → `event_end` window, computed server-side
- **Weekly top sellers** — featured **Weekly Top Selling Products** section on the home page, driven by backend flags/filters
- **Product comparison** — compare up to 2 products side by side
- **Cart** — add/update/remove items with optimistic UI updates (cart count updates instantly, then syncs with the server)
- **Checkout** — address/phone form, order creation wrapped in a DB transaction (cart is only cleared if the order is successfully created)
- **Responsive UI** — collapsible mobile sidebar, hide-on-scroll navbar, skeleton loading states

---

## 🛠️ Tech Stack

### Frontend

- React 19
- Vite
- React Router 7
- Tailwind CSS 4
- React Icons

### Backend

- Django 5.1
- Django REST Framework
- Simple JWT
- PostgreSQL
- Cloudinary
- WhiteNoise

### Deployment

- Netlify (Frontend)
- Render (Backend API)
- Supabase (PostgreSQL Database)
- Cloudinary (Image Storage)

---

## 🏗️ Architecture

The frontend and backend are fully decoupled. React communicates with Django exclusively through a REST API secured with JWT Bearer tokens.

- Short-lived Access Token (60 minutes)
- Refresh Token (1 day)
- Images stored on Cloudinary
- Discount calculations handled entirely on the backend
- Frontend simply renders the prices returned by the API

```text
React (Vite)
      │
 REST / JSON
      ▼
Django REST Framework
      │
      ├────────► Supabase PostgreSQL
      │
      └────────► Cloudinary (Product Images)
```

---

# 🚀 Getting Started Locally

## Prerequisites

- Python 3.12
- Node.js 18+
- PostgreSQL
- Cloudinary account

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the backend folder.

```
backend/.env
```

Example:

```env
SECRET_KEY=your_secret_key

DEBUG=True

DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

CLOUDINARY_CLOUD_NAME=xxxxxxxx
CLOUDINARY_API_KEY=xxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxx
```

Run migrations:

```bash
python manage.py migrate
```

Start the server:

```bash
python manage.py runserver
```

Backend runs on:

```
http://127.0.0.1:8000/api/
```

---

## Frontend Setup

```bash
cd frontend

npm install
```

Create:

```
frontend/.env
```

Add:

```env
VITE_DJANGO_BASE_URL=http://127.0.0.1:8000
```

Run:

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 📡 API Reference

| Method | Endpoint                            | Auth | Description                                |
| ------ | ----------------------------------- | ---- | ------------------------------------------ |
| POST   | `/api/register/`                    | ❌   | Create account                             |
| POST   | `/api/token/`                       | ❌   | Login                                      |
| POST   | `/api/token/refresh/`               | ❌   | Refresh JWT                                |
| GET    | `/api/products/`                    | ❌   | Product list (`?category=&search=&limit=`) |
| GET    | `/api/product/<id>/`                | ❌   | Product details                            |
| GET    | `/api/products/new-arrivals/`       | ❌   | Latest products                            |
| GET    | `/api/products/weekly-top-selling/` | ❌   | Weekly top sellers                         |
| GET    | `/api/products/sale/`               | ❌   | Products currently on sale                 |
| GET    | `/api/categories/`                  | ❌   | Categories                                 |
| GET    | `/api/offer-banner/`                | ❌   | Active seasonal offer                      |
| GET    | `/api/cart/`                        | ✅   | User cart                                  |
| POST   | `/api/cart/add/`                    | ✅   | Add to cart                                |
| POST   | `/api/cart/update/`                 | ✅   | Update quantity                            |
| POST   | `/api/cart/remove/`                 | ✅   | Remove item                                |
| POST   | `/api/orders/create/`               | ✅   | Place order                                |

---

# 🔭 Future Improvements

- Add automated Django TestCases
- Add React component testing
- Automatic JWT access-token refresh
- DRF pagination instead of `?limit=`
- Better backend validation for invalid product/cart IDs
- Wishlist functionality
- User profile page
- Order history
- Email confirmation after checkout
- Product reviews & ratings
- Admin analytics dashboard

---

# 📄 License

This project was built for portfolio and learning purposes.
