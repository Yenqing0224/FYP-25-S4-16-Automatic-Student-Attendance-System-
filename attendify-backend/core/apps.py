from django.apps import AppConfig
import sys

class CoreConfig(AppConfig):
    name = 'core'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):

        if 'migrate' in sys.argv or 'makemigrations' in sys.argv or 'test' in sys.argv:
            return

        from core import scheduler
        try:
            scheduler.start()
        except Exception as e:
            print(f"Scheduler failed to start: {e}")
