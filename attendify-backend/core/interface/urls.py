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
    path('class-details/<int:session_id>/', academics_views.get_class_details, name='class-details'),
    path('attendance-history/', academics_views.get_attendance_history, name='attendance-history'),

    # Communication
    path('newsevent/', communication_views.get_newsevent, name='newsevent'),
    path('notifications/', communication_views.get_notifications, name='notifications'),
    path('notifications/mark-read/', communication_views.mark_notifications_read, name='mark-read'),

    # Requests
    path('leaves/', requests_views.get_student_leaves, name='leaves'),
    path('appeals/', requests_views.get_student_appeals, name='appeals'),
    path('apply-leaves/', requests_views.apply_leaves, name='apply-leaves'),
    path('apply-appeals/', requests_views.apply_appeals, name='apply-appeals'),


    # Admin
    # Users
    path('admin/crud/users/', admin_views.users_list, name='crud-users-list'),
    path('admin/crud/users/<int:pk>/', admin_views.users_detail, name='crud-users-detail'),
    # Manage specific profiles
    path('admin/crud/students/', admin_views.students_list, name='crud-students-list'),
    path('admin/crud/students/<int:pk>/', admin_views.students_detail, name='crud-students-detail'), 
    path('admin/crud/lecturers/', admin_views.lecturers_list, name='crud-lecturers-list'),
    path('admin/crud/lecturers/<int:pk>/', admin_views.lecturers_detail, name='crud-lecturers-detail'),
    path('admin/crud/admins/', admin_views.admins_list, name='crud-admins-list'),
    path('admin/crud/admins/<int:pk>/', admin_views.admins_detail, name='crud-admins-detail'),

    # Academics
    path('admin/crud/semesters/', admin_views.semesters_list, name='crud-semesters-list'),
    path('admin/crud/semesters/<int:pk>/', admin_views.semesters_detail, name='crud-semesters-detail'),
    path('admin/crud/modules/', admin_views.modules_list, name='crud-modules-list'),
    path('admin/crud/modules/<int:pk>/', admin_views.modules_detail, name='crud-modules-detail'),
    path('admin/crud/sessions/', admin_views.sessions_list, name='crud-sessions-list'),
    path('admin/crud/sessions/<int:pk>/', admin_views.sessions_detail, name='crud-sessions-detail'),
    path('admin/crud/attendance/', admin_views.records_list, name='crud-records-list'),
    path('admin/crud/attendance/<int:pk>/', admin_views.records_detail, name='crud-records-detail'),

    # Communication
    path('admin/crud/notifications/', admin_views.notifs_list, name='crud-notifs-list'),
    path('admin/crud/notifications/<int:pk>/', admin_views.notifs_detail, name='crud-notifs-detail'),
    path('admin/crud/news/', admin_views.news_list, name='crud-news-list'),
    path('admin/crud/news/<int:pk>/', admin_views.news_detail, name='crud-news-detail'),
    path('admin/crud/events/', admin_views.events_list, name='crud-events-list'),
    path('admin/crud/events/<int:pk>/', admin_views.events_detail, name='crud-events-detail'),

    # Requests
    path('admin/crud/leaves/', admin_views.leaves_list, name='crud-leaves-list'),
    path('admin/crud/leaves/<int:pk>/', admin_views.leaves_detail, name='crud-leaves-detail'),
    path('admin/crud/appeals/', admin_views.appeals_list, name='crud-appeals-list'),
    path('admin/crud/appeals/<int:pk>/', admin_views.appeals_detail, name='crud-appeals-detail'),
]  