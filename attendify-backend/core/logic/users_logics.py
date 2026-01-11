class UserLogic:

    @staticmethod
    def validate_edit_profile(data):
        if 'phone_number' in data:
            phone = data['phone_number']
            if phone and (not phone.isdigit() or len(phone) < 8):
                return False, "Phone number must be at least 8 digits."

        if 'address_postal' in data:
            postal = data['address_postal']
            if postal and (not postal.isdigit() or len(postal) != 6):
                return False, "Postal code must be exactly 6 digits."

        if 'personal_email' in data:
            email = data['personal_email']
            if email and '@' not in email:
                return False, "Invalid email format."

        return True, "Data is valid"