from rest_framework import serializers
from core.models import *
from core.services.storage_services import SupabaseStorageService


# Helper Function
def upload_to_supabase(file_obj, bucket, folder, dynamic_id=None):
    if not file_obj:
        return None
    
    storage = SupabaseStorageService()
    
    return storage.upload_file(
        file_obj=file_obj, 
        bucket=bucket, 
        folder=folder, 
        user_id=str(dynamic_id) if dynamic_id else None
    )     

# Users
class AdminUserSerializer(serializers.ModelSerializer):
    upload_image = serializers.ImageField(write_only=True, required=False)
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 
                  'first_name', 'last_name', 'phone_number', 'gender', 'personal_email', 'image_path',
                  'address_street', 'address_unit', 'address_postal', 'address_country', 
                  'role_type', 'status', 'is_staff', 'is_active', 'upload_image']
        extra_kwargs = {'image_path': {'read_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        image_path = validated_data.pop('upload_image', None)
        instance = self.Meta.model(**validated_data)
        
        if password is not None:
            instance.set_password(password)
            
        instance.save()

        if image_path:
            url = upload_to_supabase(
                image_path, 
                "profile-picture", 
                "", 
                dynamic_id=instance.id
            )
            if url:
                instance.image_path = url
                instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        image_path = validated_data.pop('upload_image', None)
        
        if image_path:
            if instance.image_path:
                try:
                    storage = SupabaseStorageService()
                    storage.delete_file("secure-records", instance.image_path)
                except Exception as e:
                    print(f"Error deleting old profile image: {e}")

            url = upload_to_supabase(
                image_path, 
                "profile-picture", 
                "", 
                dynamic_id=instance.id
            )
            if url:
                instance.image_path = url

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
    upload_image = serializers.ImageField(write_only=True, required=False)
    class Meta:
        model = News
        fields = '__all__'
        extra_kwargs = {'image_url': {'read_only': True}}
    
    def create(self, validated_data):
        image_file = validated_data.pop('upload_image', None)
        instance = super().create(validated_data)
        
        if image_file:
            url = upload_to_supabase(image_file, "public-assets", "news", dynamic_id=None)
            if url:
                instance.image_url = url
                instance.save()
        return instance

    def update(self, instance, validated_data):
        image_file = validated_data.pop('upload_image', None)
        if image_file:
            storage = SupabaseStorageService()
            storage.delete_file("public-assets", instance.image_url)
            url = upload_to_supabase(image_file, "public-assets", "news", dynamic_id=None)
            if url:
                instance.image_url = url
        return super().update(instance, validated_data)

class AdminEventSerializer(serializers.ModelSerializer):
    upload_image = serializers.ImageField(write_only=True, required=False)
    class Meta:
        model = Event
        fields = '__all__'
        extra_kwargs = {'image_url': {'read_only': True}}

    def create(self, validated_data):
        image_file = validated_data.pop('upload_image', None)
        
        instance = super().create(validated_data)
        
        if image_file:
            url = upload_to_supabase(image_file, "public-assets", "events", dynamic_id=None)
            if url:
                instance.image_url = url
                instance.save()
                
        return instance
    
    def update(self, instance, validated_data):
        image_file = validated_data.pop('upload_image', None)
        
        if image_file:
            storage = SupabaseStorageService()
            storage.delete_file("public-assets", instance.image_url)
            url = upload_to_supabase(image_file, "public-assets", "events", dynamic_id=None)
            if url:
                instance.image_url = url
                
        return super().update(instance, validated_data)
    
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