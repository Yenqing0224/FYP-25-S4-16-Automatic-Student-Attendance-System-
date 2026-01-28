from rest_framework import serializers
from core.models import Semester, Module, ClassSession, AttendanceRecord, ClassRoom
from .users_serializers import StudentSerializer


class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = '__all__'


class ModuleSerializer(serializers.ModelSerializer):
    semester = SemesterSerializer(read_only=True)
    student_enrolled = serializers.IntegerField(read_only=True)
    average_attendance = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Module
        fields = '__all__'


class ClassRoomSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = ClassRoom
        fields = '__all__'


class ClassSessionSerializer(serializers.ModelSerializer):
    module = ModuleSerializer(read_only=True)
    venue = ClassRoomSerializer(read_only=True)
    total_students = serializers.IntegerField(read_only=True)
    present_students = serializers.IntegerField(read_only=True)
    absent_students = serializers.IntegerField(read_only=True)
    on_leave_students = serializers.IntegerField(read_only=True)
    attendance_rate = serializers.FloatField(read_only=True)
    
    class Meta:
        model = ClassSession
        fields = '__all__'


class AttendanceRecordSerializer(serializers.ModelSerializer):
    session = ClassSessionSerializer(read_only=True)
    student = StudentSerializer(read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = '__all__'


class FaceRecognitionSerializer(serializers.Serializer):
    student_id = serializers.CharField(max_length=50)
    venue = serializers.CharField(max_length=50)
    entry_time_stamp = serializers.DateTimeField(allow_null=True)
    exit_time_stamp = serializers.DateTimeField(allow_null=True)

class TimeTableSerializer(serializers.ModelSerializer):
    module = serializers.SerializerMethodField()
    venue = serializers.CharField(source='venue.name', read_only=True, default="TBA")
    attendance = serializers.SerializerMethodField()

    class Meta:
        model = ClassSession
        fields = [
            'id', 
            'type', 
            'date', 
            'start_time', 
            'end_time', 
            'status', 
            'module',     
            'venue',  
            'attendance' 
        ]

    def get_module(self, obj):
        return {
            "code": obj.module.code,
            "name": obj.module.name
        }

    def get_attendance(self, obj):
        if hasattr(obj, 'my_attendance') and obj.my_attendance:
            record = obj.my_attendance[0]
            return {
                "status": record.status,
                "entry_time": record.entry_time,
                "exit_time": record.exit_time,
                "remarks": record.remarks
            }
        return None