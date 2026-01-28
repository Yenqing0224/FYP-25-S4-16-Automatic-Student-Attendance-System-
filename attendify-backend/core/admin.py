from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
# User
from .models import User, Admin, Lecturer, Student
# Academics
from .models import PartnerUni, Semester, Module, ClassSession, ClassRoom, AttendanceRecord
# Communication
from .models import Notification, News, Event, Announcement
# Requests
from .models import LeaveRequest, AttendanceAppeal

class CustomUserAdmin(UserAdmin):
    # Field for editing 
    fieldsets = UserAdmin.fieldsets + (
        ('Personal Details', {
            'fields': (
                'personal_email', 
                'phone_number', 
                'gender', 
                'address_street',
                'address_unit',
                'address_postal',
                'address_country',
                'image_url',
                'face_embedding_512'
            )
        }),
        ('System Role', {
            'fields': ('role_type', 'status')
        }),
    )
    
    # Field for creating 
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Personal Details', {
            'fields': (
                'first_name', 
                'last_name', 
                'email', 
                'personal_email', 
                'phone_number', 
                'gender', 
                'address_street',
                'address_unit',
                'address_postal',
                'address_country',
                'image_path'
            ),
        }),
        ('System Role', {
            'fields': ('role_type', 'status'),
        }),
    )
    
    # List View Columns
    list_display = ('username', 'email', 'role_type', 'status', 'is_staff')
    list_filter = ('role_type', 'status')
    search_fields = ('username', 'email', 'phone_number')

# Register your models here.
admin.site.register(User, CustomUserAdmin)
admin.site.register(Admin)
admin.site.register(Lecturer)
admin.site.register(Student)
admin.site.register(PartnerUni)
admin.site.register(Semester)
admin.site.register(Module)
admin.site.register(ClassSession)
admin.site.register(ClassRoom)
admin.site.register(AttendanceRecord)
admin.site.register(Notification)
admin.site.register(News)
admin.site.register(Event)
admin.site.register(Announcement)
admin.site.register(LeaveRequest)
admin.site.register(AttendanceAppeal)
