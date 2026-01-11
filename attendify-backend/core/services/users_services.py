from django.core.exceptions import ObjectDoesNotExist
from core.logic.users_logics import UserLogic
from core.models import Student, Lecturer


class UserService:
    
    def get_profile(self, user):
        if user.role_type == 'student':
            return Student.objects.get(user=user)    
        elif user.role_type == 'lecturer':
            return Lecturer.objects.get(user=user)
        else:
            raise ValueError(f"No profile defined for role: {user.role_type}")
        
    
    def edit_profile(self, user, data):
        is_valid, message = UserLogic.validate_update_data(data)
        if not is_valid:
            return ValueError(message)
        
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
            return f"Successfully updated {updated_count} fields."
        else:
            return "No changes made."

