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
        
    def delete_file(self, bucket, file_path_or_url):
        try:
            clean_path = file_path_or_url

            if file_path_or_url.startswith("http"):
                parts = file_path_or_url.split(f"/{bucket}/")
                
                if len(parts) > 1:
                    clean_path = parts[-1]
                else:
                    print("Could not extract path from URL")
                    return False

            self.client.storage.from_(bucket).remove([clean_path])
            print(f"Deleted from Supabase: {clean_path}")
            return True

        except Exception as e:
            print(f"Supabase Delete Error: {e}")
            return False