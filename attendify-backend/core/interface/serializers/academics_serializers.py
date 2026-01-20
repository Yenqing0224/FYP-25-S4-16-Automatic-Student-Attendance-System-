from rest_framework import serializers
from core.models import Semester, Module, ClassSession, AttendanceRecord, ClassRoom
from .users_serializers import StudentSerializer


class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = '__all__'


class ModuleSerializer(serializers.ModelSerializer):
    semester = SemesterSerializer(read_only=True)
    
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
    time_stamp = serializers.DateTimeField()