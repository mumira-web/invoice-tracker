from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend

from .models import Invoice, Payment
from .serializers import (
    InvoiceListSerializer,
    InvoiceDetailSerializer,
    PaymentSerializer,
)
from .pdf import generate_invoice_pdf


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for invoices.
    Each user only sees their own invoices.
    Supports filtering by status and searching by invoice number / client name.
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'client']
    search_fields = ['invoice_number', 'client__name']
    ordering_fields = ['created_at', 'due_date', 'total']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceDetailSerializer

    def get_queryset(self):
        """Return only invoices belonging to the authenticated user."""
        return Invoice.objects.filter(
            user=self.request.user
        ).select_related('client').prefetch_related('items', 'payments')

    def perform_create(self, serializer):
        """Automatically assign the invoice to the logged-in user."""
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Only allow deleting draft invoices."""
        invoice = self.get_object()
        if invoice.status != Invoice.Status.DRAFT:
            return Response(
                {"error": "Only draft invoices can be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Mark an invoice as sent."""
        invoice = self.get_object()
        if invoice.status != Invoice.Status.DRAFT:
            return Response(
                {"error": "Only draft invoices can be sent."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invoice.status = Invoice.Status.SENT
        invoice.save(update_fields=['status'])
        return Response({"status": "Invoice marked as sent."})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an invoice."""
        invoice = self.get_object()
        if invoice.status == Invoice.Status.PAID:
            return Response(
                {"error": "Cannot cancel a fully paid invoice."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invoice.status = Invoice.Status.CANCELLED
        invoice.save(update_fields=['status'])
        return Response({"status": "Invoice cancelled."})

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Generate and download the invoice as PDF."""
        invoice = self.get_object()
        pdf_buffer = generate_invoice_pdf(invoice)

        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="{invoice.invoice_number}.pdf"'
        )
        return response

    @action(detail=True, methods=['get', 'post'], url_path='payments')
    def payments(self, request, pk=None):
        """List or create payments for a specific invoice."""
        invoice = self.get_object()

        if request.method == 'GET':
            payments = invoice.payments.all()
            serializer = PaymentSerializer(payments, many=True)
            return Response(serializer.data)

        # POST — record a new payment
        serializer = PaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(invoice=invoice)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PaymentDeleteView(viewsets.GenericViewSet):
    """Delete a specific payment (and re-update invoice status)."""
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(invoice__user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        payment = self.get_object()
        payment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
