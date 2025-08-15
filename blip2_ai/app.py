from flask import Flask, request, jsonify
from model import Blip2Model
from utils import save_temp_image
import os
import requests
import uuid
from google.cloud import translate_v2 as translate
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Google Translate
translate_client = translate.Client()

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

# 번역 함수
def translate_to_korean(text):
    result = translate_client.translate(text, target_language="ko")
    return result["translatedText"]

# 기존 caption 엔드포인트
@app.route("/caption", methods=["POST"])
def caption_image():
    image_path = None

    if "image" in request.files:
        image_file = request.files["image"]
        image_path = save_temp_image(image_file)

    elif request.is_json:
        data = request.get_json()
        image_url = data.get("image_url")
        if not image_url:
            return jsonify({"error": "image_url이 필요합니다."}), 400
        try:
            image_path = save_image_from_url(image_url)
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    else:
        return jsonify({"error": "이미지 파일 또는 image_url이 필요합니다."}), 400

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

# AI wishlist 분석 프록시 엔드포인트
@app.route("/ai/wishlists/analyze", methods=["POST"])
def analyze_wishlist():
    try:
        NODE_API_URL = "http://localhost:3000/api/wishlists/analyze"

        # Authorization 등 모든 헤더 전달 (Host 제외)
        headers = {k: v for k, v in request.headers if k.lower() != "host"}

        resp = requests.post(
            NODE_API_URL,
            headers=headers,
            data=request.get_data()
        )

        return (resp.content, resp.status_code, resp.headers.items())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
