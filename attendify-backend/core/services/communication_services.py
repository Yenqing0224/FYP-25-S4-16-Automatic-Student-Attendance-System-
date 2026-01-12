from core.models import Notification, News, Event

class CommunicationService:

    def get_newsevent(self):
        news_object = News.objects.all()
        events_object = Event.objects.filter(status__in=['upcoming', 'in_progress'])

        return news_object, events_object
    

    def get_notifications(self, user):
        return Notification.objects.filter(recipient=user)
    

    def mark_notifications_read(self, user):
        count = Notification.objects.filter(
            recipient=user, 
            is_read=False
        ).update(is_read=True)

        return count

