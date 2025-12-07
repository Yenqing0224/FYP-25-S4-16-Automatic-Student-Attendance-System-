from django.urls import path
from .views import users_views

urlpatterns = [
    path('login/', users_views.login_view, name='login'),
]