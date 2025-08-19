module.exports = {
  apps: [{
    name: 'moamoa-api',
    script: './app.js', // 또는 메인 파일
    instances: "4", // CPU 코어 수에 맞게 조정
    exec_mode: 'cluster',
    
    // 무중단 배포 설정
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000,
    
    // 환경 변수
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
        NODE_ENV: "production",
        JWT_SECRET: "3817",
        JWT_REFRESH_SECRET: "h3X7P!9zQ2m@vB1kL4yE0aS8uW5rT6n", 
        JWT_EXPIRES_IN: "2h",
        JWT_REFRESH_EXPIRES_IN: "14d",
        
        // SMTP 이메일 설정
        SMTP_HOST: "smtp.gmail.com",
        SMTP_PORT: "587",
        SMTP_USER: "moamoahelp.official@gmail.com",
        SMTP_PASS: "ujxhmbdcfhrgdgua",
        SMTP_FROM_NAME: "MOA MOA",
        SMTP_FROM_EMAIL: "moamoahelp.official@gmail.com"
        
        // AWS 설정은 서버의 환경변수에서 읽어옴 (.env 파일 또는 시스템 환경변수)
      },
    
    // 로그 설정
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 자동 재시작 설정
    max_memory_restart: '1G',
    restart_delay: 4000,
    
    // 모니터링
    min_uptime: '10s',
    max_restarts: 10,
    
    // 헬스체크
    health_check_grace_period: 30000
  }, {
    // BLIP2 AI 서버 추가
    name: 'blip2-ai',
    script: './blip2_ai/start.py',
    interpreter: 'python3',
    instances: 1,
    exec_mode: 'fork',
    
    // 환경 변수
    env: {
      FLASK_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      FLASK_ENV: 'production',
      GOOGLE_APPLICATION_CREDENTIALS: '/path/to/blip2_ai/credentials/translate-key.json'
    },
    
    // 로그 설정
    log_file: './logs/blip2-combined.log',
    out_file: './logs/blip2-out.log',
    error_file: './logs/blip2-error.log',
    
    // 자동 재시작 설정
    max_memory_restart: '2G', // AI 모델은 메모리를 많이 사용
    restart_delay: 10000,     // AI 모델 로딩 시간 고려
    
    // 모니터링
    min_uptime: '30s',
    max_restarts: 5
  }],

  deploy: {
    production: {
      user: 'ec2-user',
      host: '15.165.121.220',
      ref: 'origin/dev',
      repo: 'https://github.com/rudals02/dev.git',
      path: '/home/ec2-user/moamoa-api',
      'post-deploy': 'npm ci --only=production && pm2 reload ecosystem.config.js --env production && pm2 save'
    }
  }
};