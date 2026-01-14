class AdminLogic:

    @staticmethod
    def get_filter_config(model_name):
    
        # Default Config (Safe fallback)
        config = {
            "user_path": None,
            "relationships": {},
            "allowed_user_fields": [
                'id', 'username', 'email', 'first_name', 'last_name', 
                'role_type', 'status', 'is_staff', 'is_active'
            ]
        }

        if model_name in ['Student', 'Lecturer', 'Admin']:
            config['user_path'] = 'user'
            
        elif model_name == 'Notification':
            config['user_path'] = 'recipient'
            config['relationships'] = {
                'recipient': 'recipient'
            }

        elif model_name == 'LeaveRequest':
            config['user_path'] = 'student__user'
            config['relationships'] = {
                'student': 'student'
            }

        elif model_name == 'AttendanceAppeal':
            config['user_path'] = 'student__user'
            config['relationships'] = {
                'semester': 'session__module__semester',
                'module': 'session__module',
                'session': 'session',
                'student': 'student'
            }

        elif model_name == 'AttendanceRecord':
            config['user_path'] = 'student__user'
            config['relationships'] = {
                'semester': 'session__module__semester',
                'module': 'session__module',
                'session': 'session',
                'student': 'student'
            }

        elif model_name == 'Module':
            config['user_path'] = 'students__user'
            config['relationships'] = {
                'semester': 'semester',
                'lecturer': 'lecturer',
                'student': 'students',
            }

        elif model_name == 'ClassSession':
            config['user_path'] = 'module__students__user'
            config['relationships'] = {
                'semester': 'module__semester',
                'module': 'module',
                'lecturer': 'module__lecturer',
            }

        return config