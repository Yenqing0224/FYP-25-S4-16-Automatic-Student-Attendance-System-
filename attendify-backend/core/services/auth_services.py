from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from core.models import User
from rest_framework.authtoken.models import Token
from core.logic.auth_logics import AuthLogic

class AuthService:
    
    def login_user(self, data):
        is_valid, message = AuthLogic.validate_login_data(data)
        if not is_valid:
            raise ValueError(message)

        raw_input = data['username'].strip()
        password = data['password']
        
        username = raw_input

        if '@' in raw_input:
            try:
                user_obj = User.objects.get(email=raw_input)
                username = user_obj.username
            except User.DoesNotExist:
                raise ValueError("Invalid credentials.")

        user = authenticate(username=username, password=password)

        if not user:
            raise ValueError("Invalid credentials.")

        token, _ = Token.objects.get_or_create(user=user)

        return user, token
    

    def logout_user(self, user):
        try:
            user.auth_token.delete()
            
        except Exception:
            pass
            
        return True
    
    def change_password(self, user, data):
        is_valid, message = AuthLogic.validate_login_data(data)
        if not is_valid:
            raise ValidationError(message)
        
        current_password = data.get('current_password')
        if not user.check_password(current_password):
            raise ValidationError("The current password you entered is incorrect.")

        new_password = data.get('new_password')
        user.set_password(new_password)
        user.save()
        
        return True