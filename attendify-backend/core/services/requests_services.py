from rest_framework.response import Response
from core.models import LeaveRequest
from core.logic.requests_logics import RequestLogic

class RequestService:
    
    def get_leave(self, user):
        return LeaveRequest.objects.filter(user=user).order_by('-created_at')
    

    def apply_leave(self, user, data):
        is_valid, message = RequestLogic.validate_apply_leave(data)

        if not is_valid:
            raise ValueError(message)
        
        leave = LeaveRequest.objects.create(
            user=user,
            start_date=data['start_date'],
            end_date=data['end_date'],
            reason=data['reason'],
            description=data['description'], 
            status='pending',
        )

        return leave