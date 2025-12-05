from django.db import models

class Notification(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    isRead = models.BooleanField(default=False)
    dateSent = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
