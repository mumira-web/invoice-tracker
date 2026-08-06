from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, PaymentDeleteView

router = DefaultRouter()
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'payments/<int:pk>/',
        PaymentDeleteView.as_view({'delete': 'destroy'}),
        name='payment-delete',
    ),
]
