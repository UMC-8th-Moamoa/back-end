# 🤖 AWS에서 BLIP2 AI 서버 영구 실행 가이드

## 📋 개요
BLIP2 AI 서버를 AWS에서 안정적으로 실행하기 위한 완전한 가이드입니다.

## 🛠️ 방법 1: PM2로 백그라운드 실행 (추천)

### 1-1. PM2 설치
```bash
# Node.js 환경에서 PM2 설치
npm install -g pm2

# 또는 pip으로 PM2 대신 supervisor 사용
pip install supervisor
```

### 1-2. BLIP2 서버용 PM2 설정 파일 생성
`blip2_ai/ecosystem.config.js` 파일 생성:
```javascript
module.exports = {
  apps: [{
    name: 'blip2-ai-server',
    script: 'python',
    args: 'app.py',
    cwd: '/home/ubuntu/your-project/blip2_ai',
    interpreter: 'none',
    env: {
      PYTHONPATH: '/home/ubuntu/your-project/blip2_ai',
      PORT: '5000'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 1-3. PM2로 실행
```bash
# BLIP2 AI 디렉토리로 이동
cd /path/to/your/blip2_ai

# PM2로 실행
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 확인
pm2 logs blip2-ai-server

# 서버 재부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

## 🛠️ 방법 2: systemd 서비스로 등록

### 2-1. 서비스 파일 생성
```bash
sudo nano /etc/systemd/system/blip2-ai.service
```

### 2-2. 서비스 설정
```ini
[Unit]
Description=BLIP2 AI Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/your-project/blip2_ai
Environment=PYTHONPATH=/home/ubuntu/your-project/blip2_ai
ExecStart=/usr/bin/python3 app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2-3. 서비스 실행
```bash
# 서비스 등록
sudo systemctl daemon-reload

# 서비스 시작
sudo systemctl start blip2-ai

# 부팅 시 자동 시작 설정
sudo systemctl enable blip2-ai

# 상태 확인
sudo systemctl status blip2-ai

# 로그 확인
sudo journalctl -u blip2-ai -f
```

## 🛠️ 방법 3: Docker로 실행 (가장 안정적)

### 3-1. Dockerfile 생성
`blip2_ai/Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# 시스템 패키지 업데이트 및 필요 패키지 설치
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 포트 노출
EXPOSE 5000

# 애플리케이션 실행
CMD ["python", "app.py"]
```

### 3-2. Docker Compose 설정
`docker-compose.yml`:
```yaml
version: '3.8'
services:
  blip2-ai:
    build: ./blip2_ai
    ports:
      - "5000:5000"
    restart: always
    environment:
      - PYTHONPATH=/app
    volumes:
      - ./blip2_ai/uploads:/app/uploads
      - ./blip2_ai/credentials:/app/credentials
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3-3. Docker 실행
```bash
# Docker 이미지 빌드 및 실행
docker-compose up -d

# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f blip2-ai
```

## 🔍 4. 서버 상태 모니터링

### 4-1. 헬스체크 엔드포인트 추가
`blip2_ai/app.py`에 추가:
```python
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "blip2-ai-server"
    }), 200
```

### 4-2. 자동 재시작 스크립트
`monitor_blip2.sh`:
```bash
#!/bin/bash
while true; do
    if ! curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo "BLIP2 서버가 응답하지 않습니다. 재시작합니다..."
        pm2 restart blip2-ai-server
    fi
    sleep 30
done
```

## 🚀 5. 추천 배포 순서

1. **Docker 방식** (가장 안정적)
2. **systemd 서비스** (리눅스 네이티브)
3. **PM2 방식** (Node.js 생태계와 통합)

## ⚠️ 주의사항

1. **메모리 관리**: BLIP2 모델은 메모리를 많이 사용하므로 최소 4GB RAM 권장
2. **GPU 사용**: GPU가 있다면 CUDA 설정 필요
3. **보안**: 5000포트를 외부에 직접 노출하지 말고 nginx 리버스 프록시 사용 권장
4. **로그 관리**: 로그 파일이 너무 커지지 않도록 logrotate 설정

이 방법들 중 **Docker 방식**을 가장 추천합니다! 🐳
