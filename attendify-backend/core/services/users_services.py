from django.core.exceptions import ObjectDoesNotExist
from core.logic.users_logics import UserLogic
from core.models import Student, Lecturer, Module
from django.utils import timezone
from django.db.models import Sum


class UserService:
    
    def get_profile(self, user):
        if user.role_type == 'student':
            return Student.objects.get(user=user)    
        elif user.role_type == 'lecturer':
            lecturer = Lecturer.objects.get(user=user)
            today = timezone.localtime(timezone.now()).date()
            active_modules = Module.objects.filter(
                lecturer=lecturer,
                status='active',
                semester__start_date__lte=today,
                semester__end_date__gte=today
            )

            total_students = active_modules.aggregate(
                total=Sum('student_enrolled')
            )['total'] or 0

            lecturer.active_modules = active_modules
            lecturer.active_modules_count = active_modules.count()
            lecturer.total_students = total_students

            return lecturer
        else:
            raise ValueError(f"No profile defined for role: {user.role_type}")
        
    
    def edit_profile(self, user, data):
        is_valid, message = UserLogic.validate_edit_profile(data)
        
        if not is_valid:
            raise ValueError(message)
        
        editable_field = ['phone_number', 'personal_email', 'address_country', 
                          'address_street', 'address_unit', 'address_postal']
        
        updated_count = 0

        for x in editable_field:
            if x in data:
                current_value = getattr(user, x)
                new_value = data[x]

                if current_value != new_value:
                        setattr(user, x, new_value)
                        updated_count += 1
        if updated_count > 0:
            user.save()
            return f"Profile updated successfully!"
        else:
            return f"No changes made"

