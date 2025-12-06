from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Admin, Lecturer, Student

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Admin)
admin.site.register(Lecturer)
admin.site.register(Student)
