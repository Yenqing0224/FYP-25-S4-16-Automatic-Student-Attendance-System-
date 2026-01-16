from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
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
        is_valid, message = AuthLogic.validate_change_password(data)
        if not is_valid:
            raise ValidationError(message)
        
        current_password = data.get('current_password')
        if not user.check_password(current_password):
            raise ValidationError("The current password you entered is incorrect.")

        new_password = data.get('new_password')
        user.set_password(new_password)
        user.save()
        
        return True
    

    def request_otp(self, data):
        email = data['email']

        if not email:
            raise ValueError("Email address is required")
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return True
        
        otp = AuthLogic.generate_otp()

        cache_key = f"password_reset_{email}"
        cache.set(cache_key, otp, timeout=600)

        message = f"""Dear {user.get_full_name()},
        You are receiving this message as you have requested an OTP to reset your password.

        Do Not share this OTP with anyone.

        Your Verification Code:
        {otp}

        The OTP is valid for 10 minutes.

        This is a system generated message. Do not reply to this email.

        """

        try:
            send_mail(
                subject='Attendify Password Reset',
                message=message,
                from_email="attendify2026@outlook.com",
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Email Sending Error: {str(e)}")
            raise ValueError(f"Brevo Error: {str(e)}")
            
        return True
    

    def verify_otp(self, data):
        email = data.get('email')
        submitted_otp = data.get('otp')

        if not email or not submitted_otp:
            raise ValueError("Email and OTP are required.")
        
        if not AuthLogic.is_valid_otp_format(submitted_otp):
            raise ValueError("Invalid OTP format. It must be 6 digits.")

        cache_key = f"password_reset_{email}"
        stored_otp = cache.get(cache_key)

        if not stored_otp:
            raise ValueError("OTP has expired or does not exist.")
        
        if str(stored_otp) != str(submitted_otp):
            raise ValueError("Invalid OTP code.")
        
        return True
    

    def reset_password(self, data):
        email = data.get('email')
        otp = data.get('otp')
        new_password = data.get('new_password')

        is_valid, message = AuthLogic.validate_password_reset(data)
        if not is_valid:
            raise ValueError(message)

        cache_key = f"password_reset_{email}"
        stored_otp = cache.get(cache_key)

        if not stored_otp:
            raise ValueError("OTP has expired. Please request a new one.")
        
        if str(stored_otp) != str(otp):
            raise ValueError("Invalid OTP provided.")

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
        except User.DoesNotExist:
            raise ValueError("User account not found.")

        cache.delete(cache_key)

        return True
    
