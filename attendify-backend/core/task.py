from core.services.academics_services import AcademicService

def task_auto_create_attendance():
    service = AcademicService()
    try:
        message = service.auto_create_attendance()
        if "Generated 0" not in message:
            print(f"✅ [Task] {message}")
    except Exception as e:
        print(f"❌ [Task Error] Auto Create Attendance Failed: {e}")