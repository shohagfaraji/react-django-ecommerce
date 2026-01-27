# React + Django E-Commerce Application

A full-stack e-commerce web application built with Django REST Framework for the backend and React for the frontend.
It supports user authentication, product management, cart, checkout, and order creation.

---

## Tech Stack

Backend:

- Python
- Django
- Django REST Framework
- JWT Authentication (SimpleJWT)
- PostgreSQL / SQLite
- Django CORS Headers

Frontend:

- React
- React Router
- Axios
- Context API
- HTML, CSS, JavaScript

---

## Project Structure

```text
react-django-ecommerce/
├── backend/
│   ├── backend/
│   ├── store/
│   ├── media/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
└── README.md
```

---

## Features

- User registration and login using JWT authentication
- Product listing and product details
- Add to cart and remove from cart
- Checkout and order creation
- Payment method selection (Cash on Delivery)
- Admin product and order management
- Responsive UI

---

## Backend Setup (Django)

1. Navigate to backend folder  
   cd backend

2. Create virtual environment  
   python -m venv venv

3. Activate virtual environment  
   Windows: venv\Scripts\activate  
   macOS/Linux: source venv/bin/activate

4. Install dependencies  
   pip install -r requirements.txt

5. Run migrations  
   python manage.py migrate

6. Create superuser  
   python manage.py createsuperuser

7. Run backend server  
   python manage.py runserver

Backend runs at: http://127.0.0.1:8000/

---

## Frontend Setup (React)

1. Navigate to frontend folder  
   cd frontend

2. Install dependencies  
   npm install

3. Start development server  
   npm start

Frontend runs at: http://localhost:3000/

---

## Environment Variables

Create a .env file inside backend folder:

SECRET_KEY = your_secret_key  
DEBUG = True  
DB_NAME = your_db_name  
DB_USER = postgres  
DB_PASSWORD = your_db_password  
DB_HOST = localhost  
DB_PORT = 5432

---

## Authentication

- JWT based authentication using djangorestframework-simplejwt
- Access and refresh token system
- Tokens sent via Authorization headers

---

## Notes

- Use virtual environment for backend
- Do not commit venv, node_modules, or .env files
- This project is suitable for learning and portfolio use

---

## Author

[Shohag Faraji](https://shohagfaraji.netlify.app/)

---

## License

This project is for educational and portfolio purposes.
