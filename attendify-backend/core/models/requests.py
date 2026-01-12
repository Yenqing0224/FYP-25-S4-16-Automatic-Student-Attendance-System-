from django.db import models

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    # Relationships
    user = models.ForeignKey('core.User', on_delete=models.CASCADE, related_name='leave_requests')

    # Attributes
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    document_url = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Leave: {self.user.username} ({self.start_date})"


class AttendanceAppeal(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    # Relationships
    student = models.ForeignKey('core.Student', on_delete=models.CASCADE, related_name='appeals')
    session = models.ForeignKey('core.ClassSession', on_delete=models.CASCADE, related_name='appeals')

    # Attributes
    reason = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    document_url = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Appeal: {self.student.user.username} - {self.session.name}"
    