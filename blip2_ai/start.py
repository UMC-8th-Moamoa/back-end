#!/usr/bin/env python3
"""
PM2로 Flask 앱을 실행하기 위한 시작 스크립트
"""
import os
import sys

# 현재 디렉토리를 Python 경로에 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 환경변수 설정
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.path.join(current_dir, 'credentials', 'translate-key.json')

# Flask 앱 실행
if __name__ == "__main__":
    from app import app
    app.run(host="0.0.0.0", port=5000, debug=False)
