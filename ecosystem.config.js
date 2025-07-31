module.exports = {
  apps: [{
    name: 'moamoa-api',
    script: './app.js', // 또는 메인 파일
    instances: 4, // CPU 코어 수에 맞게 조정
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
      NODE_ENV: 'production',
      PORT: 3000
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
  }],

  deploy: {
    production: {
      user: 'ec2-user',
      host: '54.180.138.131',
      ref: 'origin/dev',
      repo: 'https://github.com/rudals02/dev.git',
      path: '/home/ec2-user/moamoa-api',
      'post-deploy': 'npm ci --only=production && pm2 reload ecosystem.config.js --env production && pm2 save'
    }
  }
};