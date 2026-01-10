from django.core.exceptions import ObjectDoesNotExist
from core.models import Student, Lecturer


class UserService:
    
    def get_profile(self, user):
        if user.role_type == 'student':
            return Student.objects.get(user=user)    
        elif user.role_type == 'lecturer':
            return Lecturer.objects.get(user=user)
        else:
            raise ValueError(f"No profile defined for role: {user.role_type}")