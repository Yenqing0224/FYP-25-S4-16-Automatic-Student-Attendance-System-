from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Admin, Lecturer, Student

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Info', {'fields': ('phone_number', 'role_type', 'gender', 'address')}),
    )
    
    # This allows these fields to be filled in when creating a NEW user
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('email', 'first_name', 'last_name', 'role_type')}),
    )

# Register your models here.
admin.site.register(User, CustomUserAdmin)
admin.site.register(Admin)
admin.site.register(Lecturer)
admin.site.register(Student)
