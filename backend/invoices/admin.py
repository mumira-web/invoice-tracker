from django.contrib import admin
from .models import Invoice, InvoiceItem, Payment


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        'invoice_number', 'client', 'status', 'total',
        'issue_date', 'due_date', 'user',
    )
    list_filter = ('status', 'issue_date')
    search_fields = ('invoice_number', 'client__name')
    inlines = [InvoiceItemInline, PaymentInline]
    readonly_fields = ('invoice_number', 'subtotal', 'tax_amount', 'total')
