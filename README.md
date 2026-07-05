# 🧾 InvoiceHub — Full-Stack Invoice & Payment Tracker

InvoiceHub is a modern, full-stack web application designed for freelancers and small business owners to manage clients, issue professional invoices, track payments, monitor revenue, and export invoices as PDF documents.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)

---

## 🌟 Key Features

- 🔐 **Authentication & Security**: Custom Django User model with JWT access/refresh token authentication, password validation, and CORS security.
- 👥 **Client Management**: Complete CRUD interface for client records with real-time search, invoice tracking, and revenue aggregation.
- 📑 **Invoice Creation & Status Management**: Dynamic line-item calculation, automated tax & discount processing, and real-time status transitions (`Draft`, `Sent`, `Paid`, `Partial`, `Overdue`, `Cancelled`).
- 💳 **Payment Processing**: Record partial or full payments with multiple payment methods (Bank Transfer, Mobile Money, Cash, Check).
- 📄 **PDF Export**: Server-side PDF invoice generation using ReportLab featuring styled headers, line-item breakdowns, and business details.
- 📊 **Interactive Analytics Dashboard**: Visual revenue insights powered by Recharts, key financial KPI metrics, and overdue notification tracking.
- 📱 **Responsive UI**: Built with React, Vite, Tailwind CSS v4, and standard accessibility patterns.

---

## 🏗️ Architecture & Technology Stack

### Backend
- **Framework**: Django 5.2 & Django REST Framework (DRF)
- **Authentication**: `djangorestframework-simplejwt`
- **PDF Generation**: `ReportLab`
- **Filtering & Search**: `django-filter` & DRF SearchFilter
- **Database**: SQLite (Development) / PostgreSQL compatible

### Frontend
- **Framework**: React 18 (Vite)
- **Routing**: `react-router-dom` v6
- **State & HTTP**: Context API + Axios (with custom JWT auto-refresh interceptors)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Notifications**: `react-hot-toast`

---

## 📁 Repository Structure

```text
invoice-tracker/
├── backend/
│   ├── accounts/       # User authentication, profiles, & JWT views
│   ├── clients/        # Client management API endpoints
│   ├── invoices/       # Invoice logic, payment tracking, & PDF generator
│   ├── dashboard/      # Financial metrics & aggregation views
│   └── config/         # Root settings, URLs, & WSGI config
└── frontend/
    ├── src/
    │   ├── api/        # Axios client with JWT refresh interceptors
    │   ├── components/ # Reusable UI components (Sidebar, StatsCard, Badges)
    │   ├── context/    # Global AuthContext provider
    │   ├── layouts/    # Dashboard layout wrapper
    │   └── pages/      # Page components (Dashboard, Invoices, Clients, Auth)
    └── vite.config.js  # Vite + Tailwind CSS plugin configuration
```

---

## 🚀 Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```
The Django REST API will run at `http://localhost:8000/api/`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The React frontend will be accessible at `http://localhost:5173/`.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
