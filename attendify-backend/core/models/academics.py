from django.db import models


class PartnerUni(models.Model):
    # Attributes
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name
    

class Semester(models.Model):
    # Attributes
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
        ]

    def __str__(self):
        return self.name
    

class Module(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    # Relationships
    semester = models.ForeignKey('Semester', on_delete=models.CASCADE, related_name='modules')
    lecturer = models.ForeignKey('core.Lecturer', on_delete=    models.SET_NULL, null=True, blank=True, related_name='modules_taught')
    students = models.ManyToManyField('core.Student', blank=True, related_name='modules_enrolled')

    # Attributes
    code = models.CharField(max_length=20, unique=True) 
    name = models.CharField(max_length=100)             
    credit = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    @property
    def average_attendance(self):
        completed_sessions = self.sessions.filter(status='completed')
        count = completed_sessions.count()
        
        if count == 0:
            return 0.0
            
        total_rate = sum(session.attendance_rate for session in completed_sessions)
        return round(total_rate / count, 2)
    
    @property
    def student_enrolled(self):
        return self.students.count()
    
    class Meta:
        indexes = [
            models.Index(fields=['lecturer', 'status']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class ClassSession(models.Model):
    TYPE_CHOICES = [
        ('lecture', 'Lecture'),
        ('tutorial', 'Tutorial'),
    ]
    
    SESSION_STATUS = [
        ('upcoming', 'Upcoming'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
    ]

    # Relationships
    module = models.ForeignKey('Module', on_delete=models.CASCADE, related_name='sessions')
    venue = models.ForeignKey('ClassRoom', on_delete=models.CASCADE, null=True, blank=True, related_name='sessions_venue')


    # Attributes
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    name = models.CharField(max_length=100) 
    date = models.DateField() 
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=SESSION_STATUS, default='upcoming')

    @property
    def total_students(self):
        return self.module.student_enrolled

    @property
    def present_students(self):
        return self.attendance_records.filter(status='present').count()
    
    @property
    def absent_students(self):
        return self.attendance_records.filter(status='absent').count()
    
    @property
    def on_leave_students(self):
        return self.attendance_records.filter(status='on_leave').count()
    
    @property
    def attendance_rate(self):
        total = self.total_students
        on_leave = self.on_leave_students
        effective_total = total - on_leave
        
        if effective_total <= 0:
            return 0.0
            
        rate = (self.present_students / effective_total) * 100
        return round(rate, 2)

    class Meta:
        indexes = [
            models.Index(fields=['date', 'start_time']),
            models.Index(fields=['date', 'status']),
            models.Index(fields=['venue', 'date', 'start_time']),
        ]

    def __str__(self):
        formatted_date = self.date.strftime('%Y-%m-%d')
        return f"{self.module.code} - {self.name} ({formatted_date}) [{self.status}]"


class ClassRoom(models.Model):
    # Attributes
    name = models.CharField(max_length=50) 

    def __str__(self):
        return self.name
    

class AttendanceRecord(models.Model):
    ATTENDANCE_STATUS = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('on_leave', 'On Leave'),
    ]

    # Relationships
    session = models.ForeignKey('ClassSession', on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey('core.Student', on_delete=models.CASCADE, related_name='attendance_records')

    # Attributes
    entry_time = models.DateTimeField(null=True, blank=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS, default='absent')
    remarks = models.CharField(max_length=200, blank=True, null=True)
    duration = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('session', 'student')
        indexes = [ 
            models.Index(fields=['session', 'status']),
            models.Index(fields=['student']),
        ]

    def __str__(self):
        return f"{self.student.user.username} {self.session.name} ({self.session.date}): {self.status}"