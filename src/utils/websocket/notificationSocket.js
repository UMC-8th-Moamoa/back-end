// websocket/notificationSocket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

/**
 * WebSocket 서버 초기화
 * @param {Object} server - HTTP 서버 인스턴스
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // JWT 인증 미들웨어
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('인증 토큰이 필요합니다'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('유효하지 않은 토큰입니다'));
    }
  });

  // 클라이언트 연결 처리
  io.on('connection', (socket) => {
    console.log(`사용자 ${socket.userId} 알림 소켓 연결됨`);
    
    // 사용자별 룸에 참가
    socket.join(`user_${socket.userId}`);

    // 연결 해제 처리
    socket.on('disconnect', () => {
      console.log(`사용자 ${socket.userId} 알림 소켓 연결 해제됨`);
    });
  });

  return io;
};

/**
 * 특정 사용자에게 토스트 알림 전송
 * @param {number} userId - 사용자 ID
 * @param {Object} notification - 알림 데이터
 */
export const sendToastNotification = (userId, notification) => {
  if (!io) {
    console.error('WebSocket 서버가 초기화되지 않았습니다');
    return;
  }

  const toastData = {
    id: notification.id,
    message: notification.message,
    type: 'info', // success, warning, error, info
    duration: 5000, // 5초간 표시
    createdAt: notification.createdAt
  };

  // 특정 사용자에게만 전송
  io.to(`user_${userId}`).emit('toast_notification', toastData);
  
  console.log(`토스트 알림 전송 완료 - 사용자 ${userId}:`, toastData.message);
};

/**
 * 여러 사용자에게 토스트 알림 전송
 * @param {Array} userIds - 사용자 ID 배열
 * @param {Object} notification - 알림 데이터
 */
export const sendToastNotificationToMultiple = (userIds, notification) => {
  userIds.forEach(userId => {
    sendToastNotification(userId, notification);
  });
};

// notification.service.js에서 사용할 수 있도록 export
export { io };
