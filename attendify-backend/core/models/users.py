from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('lecturer', 'Lecturer'),
        ('student', 'Student'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]

    # Additional attributes
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    personal_email = models.EmailField(blank=True, null=True)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    role_type = models.CharField(max_length=10, choices=ROLE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    def __str__(self):
        return f"{self.username} ({self.get_role_type_display()})"
    

class Admin(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='admin_profile')
    
    # Attributes
    admin_id = models.CharField(max_length=20, unique=True) 

    def __str__(self):
        return f"{self.user.username} {self.admin_id}"


class Lecturer(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='lecturer_profile')
    
    # Attributes
    staff_id = models.CharField(max_length=20, unique=True) 

    def __str__(self):
        return f"{self.user.username} {self.staff_id}"


class Student(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='student_profile')
    
    # Attributes
    student_id = models.CharField(max_length=20, unique=True)
    programme = models.CharField(max_length=100)
    attendance_rate = models.FloatField(default=100.0)
    attendance_threshold = models.FloatField(default=80.0)

    def __str__(self):
        return f"{self.user.username} ({self.student_id})"
