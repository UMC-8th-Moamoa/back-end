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
      origin: [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'http://54.180.138.131:3000',
        'http://localhost:3000',
        'https://www.moamoas.com',
        'https://moamoa-front-end.vercel.app',
        /^https:\/\/moamoa-front.*\.vercel\.app$/
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // JWT 인증 미들웨어 (수정됨)
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.error('웹소켓 인증 실패: 토큰 없음');
      return next(new Error('인증 토큰이 필요합니다'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      
      console.log(`✅ 웹소켓 인증 성공 - 사용자 ID: ${socket.userId}, 이메일: ${socket.userEmail}`);
      next();
    } catch (error) {
      console.error('웹소켓 JWT 검증 실패:', error.message);
      next(new Error('유효하지 않은 토큰입니다'));
    }
  });

  // 클라이언트 연결 처리
  io.on('connection', (socket) => {
    console.log(`🔌 사용자 ${socket.userId} 알림 소켓 연결됨`);
    
    // 사용자별 룸에 참가
    socket.join(`user_${socket.userId}`);
    
    // 연결 확인 이벤트 (디버깅용)
    socket.emit('connection_confirmed', {
      userId: socket.userId,
      message: '알림 소켓이 성공적으로 연결되었습니다'
    });

    // 연결 해제 처리
    socket.on('disconnect', (reason) => {
      console.log(`🔌 사용자 ${socket.userId} 알림 소켓 연결 해제됨 (이유: ${reason})`);
    });

    // 에러 처리
    socket.on('error', (error) => {
      console.error(`❌ 사용자 ${socket.userId} 소켓 에러:`, error);
    });
  });

  console.log('🚀 WebSocket 서버 초기화 완료');
  return io;
};

/**
 * 특정 사용자에게 토스트 알림 전송
 * @param {number} userId - 사용자 ID
 * @param {Object} notification - 알림 데이터
 */
export const sendToastNotification = (userId, notification) => {
  if (!io) {
    console.error('❌ WebSocket 서버가 초기화되지 않았습니다');
    return false;
  }

  try {
    const toastData = {
      id: notification.id,
      message: notification.message,
      type: notification.type || 'info', // success, warning, error, info
      title: notification.title || '알림',
      duration: 5000, // 5초간 표시
      createdAt: notification.createdAt || new Date().toISOString()
    };

    // 특정 사용자에게만 전송
    const roomName = `user_${userId}`;
    io.to(roomName).emit('toast_notification', toastData);
    
    // 전송 성공 로그
    console.log(`📤 토스트 알림 전송 - 사용자 ${userId} (룸: ${roomName}):`, toastData.message);
    
    // 연결된 클라이언트 수 확인 (디버깅용)
    const room = io.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;
    console.log(`📊 사용자 ${userId}의 연결된 클라이언트 수: ${clientCount}`);
    
    return true;
  } catch (error) {
    console.error(`❌ 토스트 알림 전송 실패 - 사용자 ${userId}:`, error);
    return false;
  }
};

/**
 * 여러 사용자에게 토스트 알림 전송
 * @param {Array} userIds - 사용자 ID 배열
 * @param {Object} notification - 알림 데이터
 */
export const sendToastNotificationToMultiple = (userIds, notification) => {
  if (!Array.isArray(userIds)) {
    console.error('❌ userIds는 배열이어야 합니다');
    return false;
  }

  let successCount = 0;
  userIds.forEach(userId => {
    if (sendToastNotification(userId, notification)) {
      successCount++;
    }
  });

  console.log(`📤 다중 토스트 알림 전송 완료: ${successCount}/${userIds.length}`);
  return successCount;
};

/**
 * 연결된 사용자 목록 조회 (디버깅용)
 */
export const getConnectedUsers = () => {
  if (!io) {
    return [];
  }

  const connectedUsers = [];
  const sockets = io.sockets.sockets;
  
  sockets.forEach((socket) => {
    if (socket.userId) {
      connectedUsers.push({
        userId: socket.userId,
        userEmail: socket.userEmail,
        socketId: socket.id,
        connected: socket.connected
      });
    }
  });

  return connectedUsers;
};

/**
 * 웹소켓 상태 확인
 */
export const getSocketStatus = () => {
  return {
    initialized: !!io,
    totalConnections: io ? io.sockets.sockets.size : 0,
    connectedUsers: getConnectedUsers()
  };
};

// notification.service.js에서 사용할 수 있도록 export
export { io };