from django.urls import path
from . import views

urlpatterns = [
    path('calculate-route/', views.calculate_route_and_logs, name='calculate_route'),
]