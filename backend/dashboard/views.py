from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from invoices.models import Invoice


class DashboardView(APIView):
    """
    Dashboard API returning key business metrics:
    - Total revenue (from paid invoices)
    - Outstanding amount (unpaid invoices)
    - Overdue count
    - Total clients
    - Recent invoices
    - Monthly revenue for the current year
    """

    def get(self, request):
        user = request.user
        invoices = Invoice.objects.filter(user=user)
        today = timezone.now().date()

        # ── Summary stats ──
        total_revenue = invoices.filter(
            status=Invoice.Status.PAID
        ).aggregate(total=Sum('total'))['total'] or 0

        outstanding = invoices.filter(
            status__in=[Invoice.Status.SENT, Invoice.Status.PARTIAL, Invoice.Status.OVERDUE]
        ).aggregate(total=Sum('total'))['total'] or 0

        overdue_count = invoices.filter(
            status__in=[Invoice.Status.SENT, Invoice.Status.PARTIAL],
            due_date__lt=today,
        ).count()

        # Auto-mark overdue invoices
        invoices.filter(
            status=Invoice.Status.SENT,
            due_date__lt=today,
        ).update(status=Invoice.Status.OVERDUE)

        total_clients = user.clients.count()
        total_invoices = invoices.count()
        draft_count = invoices.filter(status=Invoice.Status.DRAFT).count()
        paid_count = invoices.filter(status=Invoice.Status.PAID).count()

        # ── Monthly revenue (current year) ──
        current_year = today.year
        monthly_revenue = []
        for month in range(1, 13):
            revenue = invoices.filter(
                status=Invoice.Status.PAID,
                issue_date__year=current_year,
                issue_date__month=month,
            ).aggregate(total=Sum('total'))['total'] or 0
            monthly_revenue.append({
                'month': month,
                'revenue': float(revenue),
            })

        # ── Recent invoices ──
        recent = invoices[:5]
        recent_data = [
            {
                'id': inv.id,
                'invoice_number': inv.invoice_number,
                'client_name': inv.client.name,
                'total': float(inv.total),
                'status': inv.status,
                'due_date': str(inv.due_date),
            }
            for inv in recent
        ]

        return Response({
            'total_revenue': float(total_revenue),
            'outstanding': float(outstanding),
            'overdue_count': overdue_count,
            'total_clients': total_clients,
            'total_invoices': total_invoices,
            'draft_count': draft_count,
            'paid_count': paid_count,
            'monthly_revenue': monthly_revenue,
            'recent_invoices': recent_data,
        })
