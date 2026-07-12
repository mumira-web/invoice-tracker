"""
InvoiceHub URL Configuration
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/clients/', include('clients.urls')),
    path('api/invoices/', include('invoices.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]
