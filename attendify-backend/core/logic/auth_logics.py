import random

class AuthLogic:

    @staticmethod
    def validate_login_data(data):

        identifier = data.get('username')
        password = data.get('password')

        if not identifier or not identifier.strip():
            return False, "Please provide your username or email."
        
        if not password or not password.strip():
            return False, "Please provide your password."
        
        return True, None
    
    
    @staticmethod
    def validate_change_password(data):

        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')

        if not current_password or not current_password.strip():
            return False, "Please provide your current password."

        if not new_password or not new_password.strip():
            return False, "Please provide a new password."

        if not confirm_password or not confirm_password.strip():
            return False, "Please confirm your new password."

        if new_password != confirm_password:
            return False, "The new passwords do not match."

        if len(new_password) < 8:
            return False, "New password must be at least 8 characters long."

        return True, None
    

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))
    

    @staticmethod
    def is_valid_otp_format(otp):
        return str(otp).isdigit() and len(str(otp)) == 6
    

    @staticmethod
    def validate_password_reset(data):
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')

        if not new_password or not confirm_password:
            return False, "Both password fields are required."
        
        if new_password != confirm_password:
            return False, "Passwords do not match."
        
        if len(new_password) < 8:
            return False, "Password must be at least 8 characters long."

        return True, None
