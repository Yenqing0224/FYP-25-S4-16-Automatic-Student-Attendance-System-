from apscheduler.schedulers.background import BackgroundScheduler
from core import task
import atexit

def start():
    scheduler = BackgroundScheduler()

    scheduler.add_job(
        task.task_auto_create_attendance,
        trigger='cron',
        minute='*', 
        second='0',
        id='auto_attendance_creation',
        replace_existing=True
    )

    scheduler.add_job(
        task.task_update_class_status,
        trigger='cron',
        minute='*',
        second='0',
        id='update_class_status',
        replace_existing=True
    )

    scheduler.add_job(
        task.task_auto_send_reminder,
        trigger='cron',
        minute='0,10,20,30,40,50', 
        id='attendance_reminders',
        replace_existing=True
    )

    scheduler.add_job(
        task.task_update_event_status,
        trigger='cron',
        hour='0',
        minute='0', 
        timezone='Asia/Singapore',
        id='daily_update_event_status',
        replace_existing=True
    )

    scheduler.start()
    atexit.register(lambda: scheduler.shutdown())