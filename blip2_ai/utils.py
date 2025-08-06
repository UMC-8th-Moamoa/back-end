# 이미지 처리 및 기타 유틸 함수
import os
import uuid

def save_temp_image(file_storage, save_dir="uploads"):
    os.makedirs(save_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(save_dir, filename)
    file_storage.save(filepath)
    return filepath
