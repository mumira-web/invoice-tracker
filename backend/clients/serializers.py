from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    """Serializer for client CRUD operations."""
    invoice_count = serializers.SerializerMethodField()
    total_billed = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = (
            'id', 'name', 'email', 'phone', 'company',
            'address', 'city', 'country',
            'invoice_count', 'total_billed',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_invoice_count(self, obj):
        return obj.invoices.count()

    def get_total_billed(self, obj):
        from django.db.models import Sum
        result = obj.invoices.aggregate(total=Sum('total'))
        return float(result['total'] or 0)
