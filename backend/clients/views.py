from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for clients.
    Each user only sees their own clients.
    """
    serializer_class = ClientSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'company', 'phone']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return only clients belonging to the authenticated user."""
        return Client.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically assign the client to the logged-in user."""
        serializer.save(user=self.request.user)
