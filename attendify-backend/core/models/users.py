from django.db import models
from django.contrib.auth.models import AbstractUser
from pgvector.django import VectorField
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
    address_street = models.CharField(max_length=255, default="", blank=True)
    address_unit = models.CharField(max_length=50, default="", blank=True)
    address_postal = models.CharField(max_length=20, default="", blank=True)
    address_country = models.CharField(max_length=100, default="Singapore", blank=True)
    personal_email = models.EmailField(blank=True, null=True)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    role_type = models.CharField(max_length=10, choices=ROLE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.is_staff = True
            if not self.role_type: 
                self.role_type = 'admin'
        elif self.role_type == 'admin':
            self.is_staff = True
        else:
            self.is_staff = False
        super().save(*args, **kwargs)


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
    partner_uni = models.ForeignKey('PartnerUni', on_delete=models.SET_NULL, null=True, blank=True,related_name='lecturers')

    def __str__(self):
        return f"{self.user.username} {self.staff_id}"


class Student(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='student_profile')
    
    # Attributes
    student_id = models.CharField(max_length=20, unique=True)
    programme = models.CharField(max_length=100)
    attendance_threshold = models.FloatField(default=80.0)
    partner_uni = models.ForeignKey('PartnerUni', on_delete=models.SET_NULL, null=True, blank=True,related_name='students')
    registration = models.BooleanField(default=False)

    @property
    def attendance_rate(self):
        records = self.attendance_records.filter(session__status='completed')
        
        total = records.count()
        
        if total == 0:
            return 100.0

        present_count = records.filter(status='present').count()
        
        return round((present_count / total) * 100, 1)

    def __str__(self):
        return f"{self.user.username} ({self.student_id})"
