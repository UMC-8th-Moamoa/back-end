# 📦 AWS 서버 라이브러리 설치 가이드

## 🐍 Python 라이브러리 (BLIP2 AI 서버용)

### 1. 시스템 패키지 업데이트
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. 필수 시스템 도구 설치
```bash
# Ubuntu/Debian
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    wget \
    unzip \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev

# CentOS/RHEL
sudo yum install -y \
    python3 \
    python3-pip \
    git \
    curl \
    wget \
    unzip \
    gcc \
    openssl-devel \
    libffi-devel \
    python3-devel
```

### 3. BLIP2 AI 서버 Python 패키지
```bash
# 가상환경 생성 (권장)
python3 -m venv blip2_env
source blip2_env/bin/activate

# 필수 패키지들
pip install --upgrade pip

# AI/ML 관련
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install transformers
pip install Pillow
pip install requests
pip install numpy

# 웹 서버 관련
pip install flask
pip install flask-cors
pip install gunicorn

# 구글 번역 (사용 시)
pip install googletrans==4.0.0rc1

# 기타 유틸리티
pip install python-dotenv
pip install logging
```

### 4. requirements.txt 파일
`blip2_ai/requirements.txt`:
```
torch>=1.13.0
torchvision>=0.14.0
torchaudio>=0.13.0
transformers>=4.21.0
Pillow>=9.0.0
flask>=2.2.0
flask-cors>=3.0.0
gunicorn>=20.1.0
requests>=2.28.0
numpy>=1.21.0
googletrans==4.0.0rc1
python-dotenv>=0.19.0
```

## 🟢 Node.js 라이브러리 (백엔드 서버용)

### 1. Node.js 설치
```bash
# NodeSource 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js 설치
sudo apt-get install -y nodejs

# 버전 확인
node --version
npm --version
```

### 2. PM2 설치 (프로세스 관리)
```bash
npm install -g pm2
```

### 3. 프로젝트 의존성 설치
```bash
# 프로젝트 디렉토리에서
npm install

# 추가로 필요할 수 있는 패키지들
npm install --save \
    axios \
    dotenv \
    cors \
    helmet \
    compression \
    morgan \
    winston
```

## 🐳 Docker 설치 (권장)

### 1. Docker 설치
```bash
# 이전 버전 제거
sudo apt-get remove docker docker-engine docker.io containerd runc

# Docker 공식 저장소 추가
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker 설치
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🔧 시스템 설정 최적화

### 1. 메모리 설정
```bash
# 스왑 파일 생성 (메모리 부족 시)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 설정
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. 파일 디스크립터 제한 증가
```bash
# /etc/security/limits.conf에 추가
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

### 3. 방화벽 설정
```bash
# ufw 방화벽 설정
sudo ufw allow 22      # SSH
sudo ufw allow 3000    # Node.js 서버
sudo ufw allow 5000    # BLIP2 AI 서버 (내부 전용)
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS

sudo ufw enable
```

## 🚀 배포 스크립트 예시

### deploy.sh
```bash
#!/bin/bash

echo "🚀 AWS 서버 배포 시작..."

# 1. 코드 업데이트
git pull origin main

# 2. Node.js 의존성 설치
echo "📦 Node.js 패키지 설치 중..."
npm install

# 3. Python 가상환경 활성화 및 패키지 설치
echo "🐍 Python 환경 설정 중..."
cd blip2_ai
source blip2_env/bin/activate
pip install -r requirements.txt
cd ..

# 4. 환경 변수 확인
if [ ! -f .env ]; then
    echo "❌ .env 파일이 없습니다!"
    exit 1
fi

# 5. 서비스 재시작
echo "🔄 서비스 재시작 중..."
pm2 restart all

# 6. 상태 확인
sleep 5
pm2 status

echo "✅ 배포 완료!"
```

## 🔍 모니터링 도구

### 1. htop 설치 (시스템 모니터링)
```bash
sudo apt install htop
```

### 2. nginx 설치 (리버스 프록시)
```bash
sudo apt install nginx

# nginx 설정 예시
sudo nano /etc/nginx/sites-available/default
```

### nginx 설정 예시:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ai/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

이제 AWS에서 완전히 작동하는 환경을 구축할 수 있습니다! 🎉

가장 중요한 것은 **BLIP2_SERVER_URL** 환경 변수를 AWS 환경에 맞게 올바르게 설정하는 것입니다.
