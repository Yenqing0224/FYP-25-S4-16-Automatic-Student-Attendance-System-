from rest_framework import serializers
from core.models import *


# Users
class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 
                  'first_name', 'last_name', 'phone_number', 'gender', 'personal_email', 'image_path',
                  'address_street', 'address_unit', 'address_postal', 'address_country', 
                  'role_type', 'status', 'is_staff', 'is_active']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        
        if password is not None:
            instance.set_password(password)
            
        instance.save()
        return instance

    def update(self, instance, validated_data):

        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password is not None:
            instance.set_password(password)

        instance.save()
        return instance
    
class AdminStudentSerializer(serializers.ModelSerializer):
    user_details = AdminUserSerializer(source='user', read_only=True)
    class Meta:
        model = Student
        fields = '__all__'

class AdminLecturerSerializer(serializers.ModelSerializer):
    user_details = AdminUserSerializer(source='user', read_only=True)
    class Meta:
        model = Lecturer
        fields = '__all__'

class AdminAdminSerializer(serializers.ModelSerializer):
    user_details = AdminUserSerializer(source='user', read_only=True)
    class Meta:
        model = Admin
        fields = '__all__'

# Academics
class AdminPartnerUniSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerUni
        fields = '__all__'

class AdminSemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = '__all__'

class AdminModuleSerializer(serializers.ModelSerializer):
    student_enrolled = serializers.IntegerField(read_only=True)
    average_attendance = serializers.FloatField(read_only=True)

    class Meta:
        model = Module
        fields = '__all__'

class AdminClassSessionSerializer(serializers.ModelSerializer):
    total_students = serializers.IntegerField(read_only=True)
    present_students = serializers.IntegerField(read_only=True)
    absent_students = serializers.IntegerField(read_only=True)
    on_leave_students = serializers.IntegerField(read_only=True)
    attendance_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = ClassSession
        fields = '__all__'

class AdminClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = '__all__'

class AdminAttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'

# Communication
class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class AdminNewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = '__all__'

class AdminEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

class AdminAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__'

# Requests
class AdminLeaveRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    class Meta:
        model = LeaveRequest
        fields = '__all__'

class AdminAttendanceAppealSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    class Meta:
        model = AttendanceAppeal
        fields = '__all__'