from datetime import datetime

class RequestLogic:

    @staticmethod
    def validate_apply_leave(data):

        start_date = data.get('start_date')
        end_date = data.get('end_date')
        reason = data.get('reason') 

        if not start_date or not end_date:
            return False, "Start Date and End Date are required."
        
        if not reason:
            return False, "Please provide a reason for your leave."
        
        try:
            s_date = datetime.strptime(str(start_date), "%Y-%m-%d")
            e_date = datetime.strptime(str(end_date), "%Y-%m-%d")

            if s_date > e_date:
                return False, "Start Date cannot be after End Date."
            
        except ValueError:
            return False, "Invalid date format. Use YYYY-MM-DD."
        return True, None
