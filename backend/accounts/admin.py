from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'business_name', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Business Info', {
            'fields': ('business_name', 'phone', 'address', 'city', 'country'),
        }),
    )
