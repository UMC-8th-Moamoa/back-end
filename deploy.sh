#!/bin/bash

# deploy.sh - 무중단 배포 스크립트

set -e

APP_NAME="moamoa-api"
APP_DIR="/home/ec2-user/back-end"
HEALTH_CHECK_URL="http://localhost:3000/health"
TIMEOUT=60

echo "🚀 Starting zero-downtime deployment..."

# 1. 코드 업데이트
echo "📥 Pulling latest code..."
cd $APP_DIR
git pull origin dev

# 2. 의존성 설치
echo "📦 Installing dependencies..."
npm ci --only=production

# 3. 빌드 (필요한 경우)
if [ -f "package.json" ] && grep -q "build" package.json; then
    echo "🔨 Building application..."
    npm run build
fi

# 4. PM2로 무중단 배포
echo "🔄 Reloading application with PM2..."
pm2 reload $APP_NAME --update-env

# 5. 헬스체크
echo "🏥 Performing health check..."
counter=0
while [ $counter -lt $TIMEOUT ]; do
    if curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    
    if [ $counter -eq $TIMEOUT ]; then
        echo "❌ Health check failed after $TIMEOUT seconds"
        echo "🔄 Rolling back..."
        pm2 restart $APP_NAME
        exit 1
    fi
    
    echo "⏳ Waiting for application to be ready... ($counter/$TIMEOUT)"
    sleep 1
    counter=$((counter + 1))
done

# 6. PM2 상태 저장
pm2 save

echo "🎉 Deployment completed successfully!"
echo "📊 Application status:"
pm2 status $APP_NAME