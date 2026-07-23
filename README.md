# Winkelo - E-Commerce Platform

<img src="https://img.shields.io/badge/license-Portfolio_Project-blue?style=flat-square" alt="License" align="middle"/>&nbsp;&nbsp;<a href="https://winkelo.netlify.app"><img src="https://img.shields.io/badge/status-Live-1B5E20?style=flat-square&labelColor=2B3137" alt="Status: Live" align="middle"/></a>&nbsp;&nbsp;<img src="https://img.shields.io/badge/Made_with-React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="Made with React" align="middle"/>&nbsp;&nbsp;<img src="https://img.shields.io/badge/Made_with-Django-092E20?style=flat-square&logo=django&logoColor=white" alt="Made with Django" align="middle"/>&nbsp;&nbsp;<img src="https://img.shields.io/github/last-commit/shohagfaraji/react-django-ecommerce?style=flat-square&color=34495E&labelColor=2B3137" alt="Last commit" align="middle"/>

Winkelo is an e-commerce application built with a React frontend and a Django REST Framework backend. It covers the core storefront flow end to end: product discovery, account authentication, cart management, checkout, admin-managed merchandising, image delivery, and cloud deployment.

The project is intentionally split into a decoupled frontend and backend. React handles the customer experience, routing, responsive UI, and client-side performance details. Django REST Framework owns product data, authentication, cart persistence, order creation, caching, and media URL handling.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site_%F0%9F%94%97-007A78?style=for-the-badge&logo=netlify&logoColor=white&labelColor=005F5D)](https://winkelo.netlify.app)&nbsp;&nbsp;[![Backend API](https://img.shields.io/badge/Backend_API-View_API_%F0%9F%94%97-187356?style=for-the-badge&logo=render&logoColor=white&labelColor=12533E)](https://react-django-ecommerce-3cfu.onrender.com)

![Winkelo responsive storefront preview](docs/images/winkelo-preview-banner.png)

> The live deployment uses free-tier cloud services. If the backend or database is inactive, the first request may take longer than usual while the service wakes up.

---

## Table of Contents

- [At a Glance](#at-a-glance)
- [Screenshots](#screenshots)
- [Project Highlights](#project-highlights)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [API Overview](#api-overview)
- [Local Development](#local-development)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [What This Project Demonstrates](#what-this-project-demonstrates)
- [Roadmap](#roadmap)
- [License](#license)

---

## At a Glance

- **Frontend:** <img src="https://img.shields.io/badge/-React_19-20232A?style=flat&logo=react&logoColor=61DAFB" valign="middle" style="margin:2px 4px 2px 0;"/> <img src="https://img.shields.io/badge/-Vite-646CFF?style=flat&logo=vite&logoColor=white" valign="middle" style="margin:2px 4px 2px 0;"/> <img src="https://img.shields.io/badge/-React_Router-CA4245?style=flat&logo=reactrouter&logoColor=white" valign="middle" style="margin:2px 4px 2px 0;"/> <img src="https://img.shields.io/badge/-Tailwind_CSS-1a1a1a?style=flat&logo=tailwindcss&logoColor=06B6D4" valign="middle" style="margin:2px 4px 2px 0;"/> <img src="https://img.shields.io/badge/-React_Icons-E91E63?style=flat&logo=react&logoColor=white" valign="middle" style="margin:2px 4px 2px 0;"/>

- **Backend:** <img src="https://img.shields.io/badge/-Django_5.1-092E20?style=flat&logo=django&logoColor=white" valign="middle" style="margin:2px 4px 2px 0;"/> <img src="https://img.shields.io/badge/-DRF-A30000?style=flat&logo=django&logoColor=white" valign="middle" style="margin:2px 4px 2px 0;"/> <img src="https://img.shields.io/badge/-Simple_JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white" valign="middle" style="margin:2px 4px 2px 0;"/> <img src="https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white" valign="middle" style="margin:2px 4px 2px 0;"/>

- **Media:** <img src="https://img.shields.io/badge/-Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white" valign="middle" style="margin:2px 4px 2px 0;"/> Cloudinary-hosted product, category, and banner images

- **Deployment:** <img src="https://img.shields.io/badge/-Netlify-1a1a1a?style=flat&logo=netlify&logoColor=00C7B7" valign="middle" style="margin:2px 4px 2px 0;"/> <img src="https://img.shields.io/badge/-Render-1a1a1a?style=flat&logo=render&logoColor=46E3B7" valign="middle" style="margin:2px 4px 2px 0;"/> <img src="https://img.shields.io/badge/-Supabase-1a1a1a?style=flat&logo=supabase&logoColor=3ECF8E" valign="middle" style="margin:2px 4px 2px 0;"/>

- **Authentication:** JWT access/refresh tokens with protected checkout

- **Commerce flow:** Browse products, compare items, manage cart, and place orders

---

## Screenshots

| Home Page                                                  | Mobile Home                                              |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| ![Winkelo desktop home page](docs/images/home-desktop.png) | ![Winkelo mobile home page](docs/images/home-mobile.png) |

| Product Compare                                                | Cart                                                |
| -------------------------------------------------------------- | --------------------------------------------------- |
| ![Winkelo product comparison](docs/images/compare-desktop.png) | ![Winkelo mobile cart](docs/images/cart-mobile.png) |

| Checkout                                                   | Authentication                                           |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| ![Winkelo checkout page](docs/images/checkout-desktop.png) | ![Winkelo sign-up page](docs/images/sign-up-desktop.png) |

---

## Project Highlights

- **Decoupled full-stack architecture:** React communicates with Django exclusively through REST APIs.
- **JWT authentication:** Users can register, log in, refresh access tokens, and access protected checkout routes.
- **Dynamic product catalog:** Supports category filtering, section filtering, keyword search, new arrivals, sale products, and weekly top sellers.
- **Admin-managed storefront content:** Categories, hero banners, featured products, hot products, weekly top sellers, and discounts are controlled from the backend.
- **Homepage aggregation endpoint:** A single API response powers banners, deals, hot products, and category sections to reduce frontend request overhead.
- **Persistent cart:** Authenticated users can add, update, and remove cart items with immediate UI feedback.
- **Transaction-safe checkout:** Order creation is wrapped in a database transaction, so the cart is cleared only after the order is successfully created.
- **Optimized image delivery:** Cloudinary URLs are resolved and optimized server-side before being rendered by the frontend.
- **Frontend performance details:** Client-side API caching, image preloading, skeleton states, and responsive navigation improve perceived speed.
- **Deployment-ready configuration:** Environment-based settings, PostgreSQL support, CORS configuration, WhiteNoise, Gunicorn, and Render startup files are included.

---

## Tech Stack

### Frontend

<table>
<tr><th>Technology</th><th>Purpose</th></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-React_19-20232A?style=flat&logo=react&logoColor=61DAFB" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Component-based UI</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-Vite-646CFF?style=flat&logo=vite&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Frontend development server and production build</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-React_Router_7-CA4245?style=flat&logo=reactrouter&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Client-side routing</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-Tailwind_CSS_4-1a1a1a?style=flat&logo=tailwindcss&logoColor=06B6D4" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Utility-first styling</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-React_Icons-E91E63?style=flat&logo=react&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Icon system</span></td></tr>
</table>

### Backend

<table>
<tr><th>Technology</th><th>Purpose</th></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-Django_5.1-092E20?style=flat&logo=django&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Backend application framework</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-DRF-A30000?style=flat&logo=django&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">REST API layer</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-Simple_JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Access and refresh token authentication</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Relational data storage</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-django--cors--headers-092E20?style=flat&logo=django&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Cross-origin frontend/backend communication</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-WhiteNoise-000000?style=flat&logo=python&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Static file serving</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Media storage and delivery</span></td></tr>
</table>

### Deployment

<table>
<tr><th>Service</th><th>Role</th></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-Netlify-1a1a1a?style=flat&logo=netlify&logoColor=00C7B7" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Frontend hosting</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-Render-1a1a1a?style=flat&logo=render&logoColor=46E3B7" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Backend API hosting</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-Supabase-1a1a1a?style=flat&logo=supabase&logoColor=3ECF8E" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Hosted PostgreSQL database</span></td></tr>
<tr><td valign="middle"><img src="https://img.shields.io/badge/-Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white" style="margin-top:2px;"/></td><td valign="top"><span style="display:inline-block; margin-top:-10px;">Product and storefront media</span></td></tr>
</table>

---

## Architecture

```text
React + Vite Frontend
        |
        | REST / JSON over HTTPS
        v
Django REST Framework API
        |
        ├── PostgreSQL database
        ├── Cloudinary media storage
        └── Django cache layer
```

Backend responsibilities:

- Authenticate users with JWT.
- Serialize products, categories, carts, banners, and homepage data.
- Filter products by category tree, section, search query, and product flags.
- Resolve optimized image URLs for Cloudinary and local development media.
- Keep checkout consistent with database transactions.

Frontend responsibilities:

- Render responsive storefront pages.
- Manage client-side routing and protected routes.
- Store and refresh JWT tokens.
- Cache API responses and preload product images.
- Provide cart interactions with immediate user feedback.

---

## Core Features

### Storefront

- Product catalog with search, category filters, and section filters.
- Product details page with image, category, description, price, and discount data.
- New arrivals, sale products, and weekly top-selling product pages.
- Product comparison for up to two products.
- Responsive navbar, collapsible sidebar, footer, and loading states.

### Authentication

- User registration with duplicate username validation.
- Login with JWT access and refresh tokens.
- Access-token refresh for authenticated requests.
- Protected checkout route.

### Cart and Checkout

- Add products to cart.
- Update item quantities.
- Remove cart items.
- Persist cart per authenticated user.
- Create orders from cart items.
- Validate checkout phone number.
- Clear cart only after successful order creation.

### Admin-Managed Content

- Parent and child product categories.
- Featured categories for homepage sections.
- Hero banners with optional active date windows.
- Product flags for featured, hot, and weekly top-selling items.
- Product discount percentages for sale pricing.

---

## API Overview

Base URL:

```text
https://react-django-ecommerce-3cfu.onrender.com/api/
```

| Method | Endpoint                            | Auth | Description                                                                      |
| ------ | ----------------------------------- | ---- | -------------------------------------------------------------------------------- |
| POST   | `/api/register/`                    | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Create a user account                                                            |
| GET    | `/api/register/check-username/`     | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Check username availability                                                      |
| POST   | `/api/token/`                       | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Log in and receive JWT tokens                                                    |
| POST   | `/api/token/refresh/`               | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Refresh an access token                                                          |
| GET    | `/api/homepage/`                    | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Fetch homepage banners, deals, hot products, and category sections               |
| GET    | `/api/products/`                    | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | List products with optional `category`, `section`, `search`, and `limit` filters |
| GET    | `/api/product/<id>/`                | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Fetch product details                                                            |
| GET    | `/api/products/new-arrivals/`       | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Fetch newest products                                                            |
| GET    | `/api/products/weekly-top-selling/` | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Fetch weekly top-selling products                                                |
| GET    | `/api/products/sale/`               | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Fetch products with discounts                                                    |
| GET    | `/api/categories/`                  | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Fetch active category tree                                                       |
| GET    | `/api/hero-banners/`                | ![No](https://img.shields.io/badge/-No-424242?style=flat-square&logoColor=white)   | Fetch active homepage hero banners                                               |
| GET    | `/api/cart/`                        | ![Yes](https://img.shields.io/badge/-Yes-1B5E20?style=flat-square&logoColor=white)  | Fetch the authenticated user's cart                                              |
| POST   | `/api/cart/add/`                    | ![Yes](https://img.shields.io/badge/-Yes-1B5E20?style=flat-square&logoColor=white)  | Add a product to cart                                                            |
| POST   | `/api/cart/update/`                 | ![Yes](https://img.shields.io/badge/-Yes-1B5E20?style=flat-square&logoColor=white)  | Update cart item quantity                                                        |
| POST   | `/api/cart/remove/`                 | ![Yes](https://img.shields.io/badge/-Yes-1B5E20?style=flat-square&logoColor=white)  | Remove an item from cart                                                         |
| POST   | `/api/orders/create/`               | ![Yes](https://img.shields.io/badge/-Yes-1B5E20?style=flat-square&logoColor=white)  | Create an order from the current cart                                            |

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 20.19+ (or 22.12+)
- PostgreSQL
- Cloudinary account

### Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env`:

```env
SECRET_KEY=your_secret_key
DEBUG=True

DB_NAME=your_database
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Run migrations and start the backend:

```bash
python manage.py migrate
python manage.py runserver
```

Backend URL:

```text
http://127.0.0.1:8000/api/
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_DJANGO_BASE_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Backend

```bash
python manage.py runserver
python manage.py migrate
python manage.py createsuperuser
```

---

## Environment Variables

### Backend

| Variable                   | Description                           |
| -------------------------- | ------------------------------------- |
| `SECRET_KEY`               | Django secret key                     |
| `DEBUG`                    | Enables or disables Django debug mode |
| `DATABASE_URL`             | Production database connection URL    |
| `DB_NAME`                  | Local PostgreSQL database name        |
| `DB_USER`                  | Local PostgreSQL user                 |
| `DB_PASSWORD`              | Local PostgreSQL password             |
| `DB_HOST`                  | Local PostgreSQL host                 |
| `DB_PORT`                  | Local PostgreSQL port                 |
| `CLOUDINARY_CLOUD_NAME`    | Cloudinary cloud name                 |
| `CLOUDINARY_API_KEY`       | Cloudinary API key                    |
| `CLOUDINARY_API_SECRET`    | Cloudinary API secret                 |
| `RENDER_EXTERNAL_HOSTNAME` | Render-provided backend hostname      |

### Frontend

| Variable               | Description                     |
| ---------------------- | ------------------------------- |
| `VITE_DJANGO_BASE_URL` | Base URL for the Django backend |

---

## What This Project Demonstrates

- Building and deploying a complete full-stack application.
- Designing REST APIs for real storefront workflows.
- Handling token-based authentication and protected API access.
- Modeling products, categories, carts, orders, banners, and promotional content.
- Using database transactions for checkout consistency.
- Improving frontend experience with caching, preloading, and responsive layouts.
- Managing environment-specific settings for local and cloud deployments.

---

## Roadmap

- Add automated backend test coverage for cart, checkout, and authentication flows.
- Add React component and integration tests.
- Add paginated product browsing through Django REST Framework pagination.
- Add wishlist and order history pages.
- Add product reviews and ratings.
- Add customer profile management.
- Add admin analytics for sales and product performance.
- Add transactional email confirmation after checkout.

---

## License

This project was built for portfolio and learning purposes.
