from rest_framework import serializers
from .models import Invoice, InvoiceItem, Payment


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for invoice line items."""
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = InvoiceItem
        fields = ('id', 'description', 'quantity', 'unit_price', 'total')
        read_only_fields = ('id',)


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for recording payments against invoices."""

    class Meta:
        model = Payment
        fields = (
            'id', 'amount', 'method', 'payment_date', 'notes', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class InvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing invoices."""
    client_name = serializers.CharField(source='client.name', read_only=True)
    amount_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    amount_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = (
            'id', 'invoice_number', 'client', 'client_name',
            'status', 'total', 'amount_paid', 'amount_due',
            'issue_date', 'due_date', 'created_at',
        )


class InvoiceDetailSerializer(serializers.ModelSerializer):
    """Full serializer for viewing/creating/updating a single invoice."""
    items = InvoiceItemSerializer(many=True)
    payments = PaymentSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    amount_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    amount_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = (
            'id', 'invoice_number', 'client', 'client_name', 'status',
            'subtotal', 'tax_rate', 'tax_amount', 'discount', 'total',
            'issue_date', 'due_date', 'notes',
            'amount_paid', 'amount_due',
            'items', 'payments',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'invoice_number', 'subtotal', 'tax_amount', 'total',
            'created_at', 'updated_at',
        )

    def create(self, validated_data):
        """Create invoice with nested line items in a single request."""
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)

        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)

        # Calculate totals after all items are added
        invoice.calculate_totals()
        return invoice

    def update(self, instance, validated_data):
        """Update invoice and replace its line items."""
        items_data = validated_data.pop('items', None)

        # Update invoice fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace items if provided
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)

        instance.calculate_totals()
        return instance
