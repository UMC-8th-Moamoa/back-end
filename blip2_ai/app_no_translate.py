from flask import Flask, request, jsonify
from model import Blip2Model
from utils import save_temp_image
import os
import requests
import uuid
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Flask App & Model
app = Flask(__name__)
caption_model = Blip2Model()

# S3 이미지 URL로부터 다운로드
def save_image_from_url(image_url):
    response = requests.get(image_url)
    if response.status_code != 200:
        raise ValueError("이미지를 다운로드하지 못했습니다.")

    filename = f"{uuid.uuid4()}.jpg"
    path = os.path.join("uploads", filename)
    with open(path, "wb") as f:
        f.write(response.content)

    return path

# 간단한 번역 함수 (Google Translate API 없이)
def translate_to_korean(text):
    # Google Translate API가 없을 때 영어 그대로 반환
    # 또는 간단한 단어 변환 로직 추가 가능
    return f"[번역 비활성화] {text}"

@app.route("/caption", methods=["POST"])
def caption_image():
    image_path = None

    # 1. form-data 이미지 파일 (image) 우선
    if "image" in request.files:
        image_file = request.files["image"]
        image_path = save_temp_image(image_file)

    # 2. JSON에 image_url 있는 경우
    elif request.is_json:
        data = request.get_json()
        image_url = data.get("image_url")
        if not image_url:
            return jsonify({"error": "image_url이 필요합니다."}), 400
        try:
            image_path = save_image_from_url(image_url)
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # 3. 아무것도 없는 경우
    else:
        return jsonify({"error": "이미지 파일 또는 image_url이 필요합니다."}), 400

    # 이미지 분석 + 번역
    try:
        english_caption = caption_model.generate_caption(image_path)
        korean_caption = translate_to_korean(english_caption)
    finally:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)

    return jsonify({
        "caption_en": english_caption,
        "caption_ko": korean_caption
    })

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "OK",
        "message": "BLIP2 AI 서버가 정상 작동 중입니다."
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
