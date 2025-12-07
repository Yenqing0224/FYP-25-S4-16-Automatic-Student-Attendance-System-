from django.urls import path
from .views import users_views
from .views import communication_views

urlpatterns = [
    # Users
    path('login/', users_views.login_view, name='login'),

    # Communication
    path('newsevent/', communication_views.get_newsevent, name='newsevent'),
    path('notifications/', communication_views.get_notifications, name='notifications'),
    path('notifications/mark-read/', communication_views.mark_notifications_read, name='mark-read'),
]