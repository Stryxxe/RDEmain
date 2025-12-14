"""
URL routing for documents app
"""

from django.urls import path
from . import views

urlpatterns = [
    path('process/', views.process_document, name='process_document'),
    path('ocr-status/', views.ocr_status, name='ocr_status'),
    path('health/', views.health_check, name='health_check'),
]
