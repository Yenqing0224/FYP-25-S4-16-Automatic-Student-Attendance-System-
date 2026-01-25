import os
import uuid
from supabase import create_client, Client

class SupabaseStorageService:
    def __init__(self):
        # Initialize 
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        self.client: Client = create_client(url, key)

    def upload_file(self, file_obj, bucket, folder, user_id=None):
        try:
            # Create a unique filename
            ext = file_obj.name.split('.')[-1]
            filename = f"{uuid.uuid4()}.{ext}"

            # Construct the Path
            if user_id:
                file_path = f"{user_id}/{folder}/{filename}"
            else:
                file_path = f"{folder}/{filename}"

            # Upload to Supabase
            file_content = file_obj.read()
            self.client.storage.from_(bucket).upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": file_obj.content_type}
            )

            # Return the correct value
            if bucket == "public-assets":
                # Public: Return full URL
                return self.client.storage.from_(bucket).get_public_url(file_path)
            else:
                # Secure: Return path only
                return file_path

        except Exception as e:
            print(f"Supabase Upload Error: {e}")
            return None