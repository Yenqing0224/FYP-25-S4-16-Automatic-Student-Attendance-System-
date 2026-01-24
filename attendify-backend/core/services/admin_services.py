from core.logic.admin_logics import AdminLogic
from core.models import *

class AdminService:

    def __init__(self, model_class):
        self.model = model_class
        self.model_name = model_class.__name__

    def get_filtered_queryset(self, query_params):

        config = AdminLogic.get_filter_config(self.model_name)
        
        filter_kwargs = {}
        direct_fields = [f.name for f in self.model._meta.fields]

        for key, value in query_params.items():
            
            # Direct Field
            if key in direct_fields:
                filter_kwargs[key] = value

            # Relationship Shortcuts
            elif key in config['relationships']:
                db_path = config['relationships'][key]
                filter_kwargs[db_path] = value

            # Deep Filters (e.g. semester__name)
            elif '__' in key:
                prefix, suffix = key.split('__', 1)
                if prefix in config['relationships']:
                    base_path = config['relationships'][prefix]
                    filter_kwargs[f"{base_path}__{suffix}"] = value
            
            # User Fields
            elif key in config['allowed_user_fields']:
                if config['user_path']:
                    filter_kwargs[f"{config['user_path']}__{key}"] = value

        return self.model.objects.filter(**filter_kwargs).distinct().order_by('pk')
    

    def create_item(self, data, serializer_class):
        serializer = serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return serializer.data, None
        return None, serializer.errors
    
    
    @staticmethod
    def get_student_semester_attendance(student_id):
        try:
            student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            return None

        semesters = Semester.objects.all().order_by('-start_date')
        results = []

        for sem in semesters:
            records = AttendanceRecord.objects.filter(
                student=student,
                session__module__semester=sem,
                session__status='completed'
            )

            total_sessions = records.count()
            present_count = records.filter(status='present').count()
            on_leave_count = records.filter(status='on_leave').count()

            effective_total = total_sessions - on_leave_count
            
            attendance_rate = "-"
            
            if effective_total > 0:
                rate = (present_count / effective_total) * 100
                attendance_rate = f"{round(rate, 2)}%"
            elif total_sessions > 0 and effective_total == 0:
                attendance_rate = "On Leave"

            results.append({
                "id": sem.id,
                "name": sem.name,
                "start_date": sem.start_date,
                "end_date": sem.end_date,
                "attendance_rate": attendance_rate
            })

        return results