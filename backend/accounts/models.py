from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model for InvoiceHub.
    Extends Django's built-in user with business-related fields
    that appear on generated invoices.
    """
    business_name = models.CharField(max_length=200, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='Ethiopia')

    def __str__(self):
        return self.business_name or self.get_full_name() or self.username
