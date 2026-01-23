from django.db import models
from django.utils import timezone

class Notification(models.Model):
    # Relationships
    recipient = models.ForeignKey('core.User', on_delete=models.CASCADE, related_name='notifications')
    
    # Attributes
    title = models.CharField(max_length=255)
    description = models.TextField()
    is_read = models.BooleanField(default=False)
    date_sent = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_sent'] # Newest first

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"
    

class News(models.Model):
    # Attributes
    title = models.CharField(max_length=255)
    message = models.TextField(help_text="Short summary or highlight")
    description = models.TextField(help_text="Full content of the news")
    news_date = models.DateTimeField(default=timezone.now) 
    image_url = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "News" # Fixes Django showing "Newss"
        ordering = ['-news_date']

    def __str__(self):
        return self.title ({self.created_at})


class Event(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('happening_today', 'Happening Today'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    # Attributes
    title = models.CharField(max_length=255)
    message = models.TextField(help_text="Short teaser or subtitle")
    description = models.TextField(help_text="Full event details")
    organizer = models.CharField(max_length=100)
    event_date = models.DateTimeField()
    venue = models.CharField(max_length=100)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    created_at = models.DateTimeField(auto_now_add=True)

    # Stats
    total_student = models.IntegerField(default=0)


    class Meta:
        ordering = ['-event_date']

    def __str__(self):
        return f"{self.title} ({self.event_date.date()}) [{self.status}]"
    

class Announcement(models.Model):
    # Attributes
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    posted_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, related_name='annoucement')

    class Meta:
        ordering = ['-created_at'] # Newest first
    def __str__(self):
        return f"{self.posted_by.username} - {self.title} ({self.created_at})"