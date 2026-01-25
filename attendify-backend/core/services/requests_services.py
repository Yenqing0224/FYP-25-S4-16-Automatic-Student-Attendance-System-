from rest_framework.response import Response
from core.models import LeaveRequest, Student, AttendanceAppeal, ClassSession
from core.logic.requests_logics import RequestLogic
from core.services.storage_services import SupabaseStorageService

class RequestService:
    
    def get_leaves(self, user):
        return LeaveRequest.objects.filter(user=user).order_by('-created_at')
    

    def apply_leaves(self, user, data):
        is_valid, message = RequestLogic.validate_apply_leaves(data)

        if not is_valid:
            raise ValueError(message)
        
        file_path = None
        document = data.get('document')

        if document:
            storage = SupabaseStorageService()
            
            folder_id = str(user.id)

            file_path = storage.upload_file(
                file_obj=document, 
                bucket="secure-records", 
                folder="leave", 
                user_id=folder_id
            )

        leave = LeaveRequest.objects.create(
            user=user,
            start_date=data['start_date'],
            end_date=data['end_date'],
            reason=data['reason'],
            description=data['description'], 
            status='pending',
            document_path=file_path
        )

        return leave
    
    
    def get_student_appeals(self, user):
        student = Student.objects.get(user=user)
        return AttendanceAppeal.objects.filter(student=student).order_by('-created_at')
    

    def apply_appeals(self, user, data):
        is_valid, message = RequestLogic.validate_apply_appeals(data)

        if not is_valid:
            raise ValueError(message)
        
        student = Student.objects.get(user=user)
        session = ClassSession.objects.get(id=data['session_id'])

        file_path = None
        document = data.get('document')

        if document:
            storage = SupabaseStorageService()
            
            folder_id = str(user.id)

            file_path = storage.upload_file(
                file_obj=document, 
                bucket="secure-records", 
                folder="appeal",
                user_id=folder_id
            )

        appeal = AttendanceAppeal.objects.create(
            student=student,
            session=session,
            reason=data['reason'],
            description=data['description'],
            document_url=None,
            status='pending',
            document_path=file_path
        )

        return appeal

