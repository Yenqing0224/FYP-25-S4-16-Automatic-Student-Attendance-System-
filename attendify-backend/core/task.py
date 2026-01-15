from core.services.academics_services import AcademicService
from core.services.communication_services import CommunicationService

def task_auto_create_attendance():
    service = AcademicService()
    try:
        message = service.auto_create_attendance()
        if "Generated 0" not in message:
            print(f"[Task] {message}")
    except Exception as e:
        print(f"[Task Error] Auto Create Attendance Failed: {e}")


def task_update_class_status():
    service = AcademicService()
    try:
        message = service.auto_update_class_status()
        if "Updated status for 0" not in message:
             print(f"[Task] {message}")
    except Exception as e:
        print(f"[Task Error] Update Status Failed: {e}")


def task_auto_send_reminder():
    service = CommunicationService()
    try:
        message = service.auto_send_reminder()
        if "Sent 0 reminders" not in message:
            print(f"[Task] {message}")
    except Exception as e:
        print(f"[Task Error] Auto Send Notification Failed: {e}")