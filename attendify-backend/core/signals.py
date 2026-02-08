from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from core.models import LeaveRequest, AttendanceAppeal, News, Event, User, Notification
from core.services.storage_services import SupabaseStorageService
from core.services.communication_services import CommunicationService

@receiver(post_delete, sender=News)
def delete_news_image(sender, instance, **kwargs):
    if instance.image_url:
        storage = SupabaseStorageService()
        storage.delete_file("public-assets", instance.image_url)


@receiver(post_delete, sender=Event)
def delete_event_image(sender, instance, **kwargs):
    if instance.image_url:
        storage = SupabaseStorageService()
        storage.delete_file("public-assets", instance.image_url)


@receiver(post_delete, sender=User)
def delete_user_profile_pic(sender, instance, **kwargs):
    if instance.image_path:
        storage = SupabaseStorageService()
        storage.delete_file("secure-records", instance.image_path)


@receiver(post_delete, sender=LeaveRequest)
def delete_leave_file(sender, instance, **kwargs):
    if instance.document_path:
        storage = SupabaseStorageService()
        storage.delete_file("secure-records", instance.document_path)


@receiver(post_delete, sender=AttendanceAppeal)
def delete_appeal_file(sender, instance, **kwargs):
    if getattr(instance, 'document_path', None):
        storage = SupabaseStorageService()
        storage.delete_file("secure-records", instance.document_path)


@receiver(post_save, sender=Notification)
def auto_send_push_notification(sender, instance, created, **kwargs):
    if created:
        recipient = instance.recipient

        if not hasattr(recipient, 'student_profile'):
            return 

        token = recipient.student_profile.expo_push_token
        if not token:
            return

        service = CommunicationService()
        service.send_push_to_token(
            token=token,
            title=instance.title,
            body=instance.description,
            data={"type": "notification", "id": instance.id}
        )