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