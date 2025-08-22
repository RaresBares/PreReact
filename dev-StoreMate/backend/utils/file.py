import os
from uuid import uuid4
from fastapi import UploadFile
from app.config import settings

def save_upload_file(upload_file: UploadFile, subdir: str = "") -> str:
    ext = os.path.splitext(upload_file.filename)[1]
    filename = f"{uuid4().hex}{ext}"
    dir_path = os.path.join(settings.MEDIA_DIR, subdir)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, filename)
    with open(file_path, "wb") as f:
        f.write(upload_file.file.read())
    return file_path
