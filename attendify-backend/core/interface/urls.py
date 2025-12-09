from django.urls import path
from .views import auth_views
from .views import users_views
from .views import communication_views
from .views import academics_views
from .views import requests_views
from .views import admin_views


urlpatterns = [
    # Auth
    path('login/', auth_views.login_view, name='login'),

    # Users
    path('profile/', users_views.get_student_profile, name='profile'),
    path('edit-profile/', users_views.edit_profile, name='edit-profile'),

    # Academics
    path('dashboard/', academics_views.get_dashboard, name='dashboard-stats'),
    path('timetable/', academics_views.get_timetable, name='timetable'),

    # Communication
    path('newsevent/', communication_views.get_newsevent, name='newsevent'),
    path('notifications/', communication_views.get_notifications, name='notifications'),
    path('notifications/mark-read/', communication_views.mark_notifications_read, name='mark-read'),

    # Requests
    path('leaves/', requests_views.get_student_leaves, name='leaves'),
    path('appeals/', requests_views.get_student_appeals, name='appeals'),
    path('apply-leaves/', requests_views.apply_leaves, name='apply-leaves'),

    # Admin
    path('admin/news/', admin_views.news_list_create, name='admin-news-list'),
    path('admin/news/<int:pk>/', admin_views.news_detail, name='admin-news-detail'),
    path('admin/events/', admin_views.events_list_create, name='admin-events-list'),
    path('admin/events/<int:pk>/', admin_views.events_detail, name='admin-events-detail'),
    path('admin/notifications/', admin_views.notifications_list_create, name='admin-notifications-list'),
    path('admin/notifications/<int:pk>/', admin_views.notifications_detail, name='admin-notifications-detail'),
]  