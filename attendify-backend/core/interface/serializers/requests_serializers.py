from rest_framework import serializers
from core.models import LeaveRequest, AttendanceAppeal
from .users_serializers import StudentSerializer
from .academics_serializers import ClassSessionSerializer


class LeaveRequestSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = '__all__'


class AttendanceAppealSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    session = ClassSessionSerializer(read_only=True)
    
    class Meta:
        model = AttendanceAppeal
        fields = '__all__'