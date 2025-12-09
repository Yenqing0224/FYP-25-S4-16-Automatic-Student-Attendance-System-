from rest_framework import serializers
from core.models import User, Admin, Lecturer, Student


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number',
                  'personal_email', 'address_street', 'address_unit',
                  'address_postal',  'address_country','role_type', 'gender', 'image_url']


class AdminSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Admin
        fields = '__all__'


class LecturerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Lecturer
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Student
        fields = '__all__'

