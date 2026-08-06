import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Invoice(models.Model):
    """
    An invoice sent to a client for services/products.
    Contains line items, tax, discount, and payment tracking.
    """

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        PAID = 'paid', 'Paid'
        PARTIAL = 'partial', 'Partially Paid'
        OVERDUE = 'overdue', 'Overdue'
        CANCELLED = 'cancelled', 'Cancelled'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='invoices',
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='invoices',
    )
    invoice_number = models.CharField(max_length=50, unique=True, editable=False)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    # Financial fields
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Dates
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()

    # Additional info
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_number} — {self.client.name}"

    def save(self, *args, **kwargs):
        # Auto-generate invoice number on first save
        if not self.invoice_number:
            self.invoice_number = self._generate_invoice_number()
        super().save(*args, **kwargs)

    def _generate_invoice_number(self):
        """Generate a unique invoice number like INV-2026-0001."""
        year = timezone.now().year
        last = Invoice.objects.filter(
            invoice_number__startswith=f'INV-{year}-'
        ).order_by('-invoice_number').first()

        if last:
            last_num = int(last.invoice_number.split('-')[-1])
            new_num = last_num + 1
        else:
            new_num = 1

        return f'INV-{year}-{new_num:04d}'

    def calculate_totals(self):
        """Recalculate subtotal, tax, and total from line items."""
        self.subtotal = sum(
            item.quantity * item.unit_price for item in self.items.all()
        )
        self.tax_amount = self.subtotal * (self.tax_rate / 100)
        self.total = self.subtotal + self.tax_amount - self.discount
        self.save(update_fields=['subtotal', 'tax_amount', 'total'])

    def update_status(self):
        """Update invoice status based on payments received."""
        if self.status == self.Status.CANCELLED:
            return

        total_paid = sum(p.amount for p in self.payments.all())

        if total_paid >= self.total:
            self.status = self.Status.PAID
        elif total_paid > 0:
            self.status = self.Status.PARTIAL
        elif self.due_date < timezone.now().date() and self.status != self.Status.DRAFT:
            self.status = self.Status.OVERDUE
        # Don't change draft/sent status if no payments

        self.save(update_fields=['status'])

    @property
    def amount_paid(self):
        return sum(p.amount for p in self.payments.all())

    @property
    def amount_due(self):
        return self.total - self.amount_paid


class InvoiceItem(models.Model):
    """A single line item on an invoice."""
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items',
    )
    description = models.CharField(max_length=500)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.description} (x{self.quantity})"


class Payment(models.Model):
    """A payment recorded against an invoice."""

    class Method(models.TextChoices):
        CASH = 'cash', 'Cash'
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        MOBILE_MONEY = 'mobile_money', 'Mobile Money'
        CHECK = 'check', 'Check'
        OTHER = 'other', 'Other'

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='payments',
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.BANK_TRANSFER,
    )
    payment_date = models.DateField(default=timezone.now)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"Payment of {self.amount} on {self.payment_date}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Auto-update invoice status after payment
        self.invoice.update_status()

    def delete(self, *args, **kwargs):
        invoice = self.invoice
        super().delete(*args, **kwargs)
        # Re-update status after payment deletion
        invoice.update_status()
