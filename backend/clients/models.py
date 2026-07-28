from django.db import models
from django.conf import settings


class Client(models.Model):
    """
    A client/customer that invoices are billed to.
    Each client belongs to one user (the business owner).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='clients',
    )
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    company = models.CharField(max_length=200, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='Ethiopia')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.company})" if self.company else self.name
