// notification.service.js (파라미터 순서 수정)
import { notificationRepository } from '../repositories/notification.repository.js';
import { NotificationResponseDTO, UnreadNotificationStatusDTO } from '../dtos/notification.dto.js';
import { sendToastNotification } from '../utils/websocket/notificationSocket.js';

/**
 * 알림 관련 비즈니스 로직을 처리하는 Service 클래스
 */
class NotificationService {

  /**
   * DB 저장 없이 토스트 알림만 전송
   * @param {number} userId
   * @param {string} message
   * @param {string} type (optional)
   * @param {string} title (optional)
   */
  async sendToastOnlyNotification(userId, message, type = 'info', title = '알림') {
    const toast = {
      id: `toast_${Date.now()}`,
      message,
      type,
      title,
      createdAt: new Date().toISOString()
    };
    sendToastNotification(userId, toast);
  }

  /**
   * 팔로우한 친구의 생일이 일주일 전일 때 알림 (BIRTHDAY_REMINDER)
   */
  async createBirthdayReminderToFollowers(followers, birthdayPersonName, daysLeft = 7) {
    const type = 'BIRTHDAY_REMINDER';
    const title = '생일 알림';
    const message = `${birthdayPersonName}님의 생일이 ${daysLeft}일 남았습니다! 생일 모아에 참여해보세요.`;
    for (const follower of followers) {
      await this.createNotificationWithAllParams(follower.id, type, title, message);
    }
  }

  /**
   * 친구 생일 이벤트가 생성되었거나, 팔로우 시 이미 진행 중이면 알림 (FRIEND_EVENT_CREATED)
   */
  async createFriendEventCreatedToFollowers(followers, friendName) {
    const type = 'FOLLOWED';
    const title = '팔로우 알림';
    const message = `${friendName}님이 회원님을 팔로우하기 시작했습니다.`;
    for (const follower of followers) {
      await this.createNotificationWithAllParams(follower.id, type, title, message);
    }
  }

  /**
   * 구매 인증 등록 시 참여자 전체 알림 (PURCHASE_PROOF)
   */
  async createPurchaseProofToParticipants(participants, birthdayPersonName) {
    const type = 'PURCHASE_PROOF';
    const title = '구매 인증 등록';
    const message = `${birthdayPersonName}님의 생일 모아에서 구매 인증이 등록되었습니다!`;
    for (const participant of participants) {
      await this.createNotificationWithAllParams(participant.userId, type, title, message);
    }
  }

  /**
   * 이벤트 종료 시 참여자 전체 알림 (EVENT_COMPLETED)
   */
  async createEventCompletedToParticipants(participants, birthdayPersonName) {
    const type = 'EVENT_COMPLETED';
    const title = '이벤트 종료';
    const message = `${birthdayPersonName}님의 생일 모아 이벤트가 종료되었습니다!`;
    for (const participant of participants) {
      await this.createNotificationWithAllParams(participant.userId, type, title, message);
    }
  }

  async getNotifications(userId, { page, size, offset }) {
    try {
      const notifications = await notificationRepository.getNotifications(userId, offset, size);
      const totalElements = await notificationRepository.getTotalNotificationCount(userId);
      const hasUnreadNotifications = await notificationRepository.hasUnreadNotifications(userId);

      const totalPages = Math.ceil(totalElements / size);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      const pagination = {
        page,
        size,
        totalElements,
        totalPages,
        hasNext,
        hasPrevious
      };

      const responseDTO = new NotificationResponseDTO(
        notifications, 
        pagination, 
        hasUnreadNotifications
      );

      return responseDTO.toResponse();
    } catch (error) {
      console.error('알림 목록 조회 서비스 오류:', error);
      throw new Error('알림 목록을 조회하는 중 오류가 발생했습니다');
    }
  }

  async getUnreadNotificationStatus(userId) {
    try {
      const hasUnreadNotifications = await notificationRepository.hasUnreadNotifications(userId);
      const responseDTO = new UnreadNotificationStatusDTO(hasUnreadNotifications);
      return responseDTO.toResponse();
    } catch (error) {
      console.error('읽지 않은 알림 상태 확인 서비스 오류:', error);
      throw new Error('읽지 않은 알림 상태를 확인하는 중 오류가 발생했습니다');
    }
  }

  async markNotificationAsRead(notificationId, userId) {
    try {
      await notificationRepository.markNotificationAsRead(notificationId, userId);
      return {
        message: '알림이 읽음 처리되었습니다.'
      };
    } catch (error) {
      console.error('알림 읽음 처리 서비스 오류:', error);
      if (error.message === '해당 알림을 찾을 수 없습니다') {
        throw error;
      }
      throw new Error('알림을 읽음 처리하는 중 오류가 발생했습니다');
    }
  }

  async markAllNotificationsAsRead(userId) {
    try {
      const updatedCount = await notificationRepository.markAllNotificationsAsRead(userId);
      return {
        message: `${updatedCount}개의 알림이 읽음 처리되었습니다.`,
        updatedCount
      };
    } catch (error) {
      console.error('모든 알림 읽음 처리 서비스 오류:', error);
      throw new Error('모든 알림을 읽음 처리하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 기본 알림 생성 - ✅ 파라미터 순서 수정
   * @param {number} userId - 사용자 ID
   * @param {string} message - 알림 메시지 (첫 번째 파라미터로 변경)
   * @param {string} type - 알림 타입 (선택사항)
   * @param {string} title - 알림 제목 (선택사항)
   */
  async createNotification(userId, message, type = 'SYSTEM', title = '알림') {
    try {
      const notification = await notificationRepository.createNotificationWithType(
        userId,
        type,
        title,
        message
      );

      await this.sendRealTimeNotification(userId, notification);
      return notification;
    } catch (error) {
      console.error('알림 생성 서비스 오류:', error);
      throw new Error('알림을 생성하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 확장 알림 생성 (모든 파라미터 명시)
   * @param {number} userId - 사용자 ID
   * @param {string} type - 알림 타입
   * @param {string} title - 알림 제목
   * @param {string} message - 알림 메시지
   */
  async createNotificationWithAllParams(userId, type, title, message) {
    try {
      const notification = await notificationRepository.createNotificationWithType(
        userId,
        type,
        title,
        message
      );

      await this.sendRealTimeNotification(userId, notification);
      return notification;
    } catch (error) {
      console.error('알림 생성 서비스 오류:', error);
      throw new Error('알림을 생성하는 중 오류가 발생했습니다');
    }
  }

  async sendRealTimeNotification(userId, notification) {
    try {
      sendToastNotification(userId, notification);
      console.log(`토스트 알림 전송 완료 - 사용자 ${userId}:`, {
        message: notification.message,
        createdAt: notification.createdAt
      });
    } catch (error) {
      console.error('실시간 알림 전송 오류:', error);
    }
  }

  /**
   * 송금과 함께 모아 참여 알림 생성
   */
  async createMoaParticipationNotification(birthdayPersonId, participantName, amount) {
    const type = 'MOA_PARTICIPATION';
    const title = '모아 참여 알림';
    const message = `${participantName}님이 ${amount.toLocaleString()}원을 모아에 참여했어요!`;
    
    return await this.createNotificationWithAllParams(
      birthdayPersonId, 
      type,
      title, 
      message
    );
  }

  /**
   * 송금 없이 모아 참여 알림 생성
   */
  async createMoaJoinNotification(birthdayPersonId, participantName) {
    const type = 'MOA_PARTICIPATION';
    const title = '모아 참여 알림';
    const message = `${participantName}님이 모아에 참여했어요!`;
    
    return await this.createNotificationWithAllParams(
      birthdayPersonId, 
      type,
      title, 
      message
    );
  }

  /**
   * 모아 완료 알림 생성
   */
  async createMoaCompletedNotification(birthdayPersonId, totalAmount) {
    const type = 'MOA_COMPLETED';
    const title = '모아 완료!';
    const message = `생일 모아가 완료되었어요! 총 ${totalAmount.toLocaleString()}원이 모였습니다!`;
    
    return await this.createNotificationWithAllParams(
      birthdayPersonId, 
      type,
      title, 
      message
    );
  }

  /**
   * 생일 알림 생성
   */
  async createBirthdayReminderNotification(userId, birthdayPersonName, daysLeft) {
    const type = 'BIRTHDAY_REMINDER';
    const title = '생일 알림';
    let message;
    
    if (daysLeft === 0) {
      message = `오늘은 ${birthdayPersonName}님의 생일입니다!`;
    } else if (daysLeft === 1) {
      message = `내일은 ${birthdayPersonName}님의 생일입니다!`;
    } else {
      message = `${daysLeft}일 후 ${birthdayPersonName}님의 생일입니다!`;
    }
    
    return await this.createNotificationWithAllParams(
      userId, 
      type,
      title, 
      message
    );
  }

  /**
   * 편지 수신 알림 생성
   */
  async createLetterReceivedNotification(receiverId, senderName) {
    const type = 'LETTER_RECEIVED';
    const title = '새 편지 도착';
    const message = `${senderName}님이 편지를 보냈어요!`;
    
    return await this.createNotificationWithAllParams(
      receiverId, 
      type,
      title, 
      message
    );
  }

  /**
   * 모아 초대 알림 생성
   */
  async createMoaInviteNotification(userId, inviterName, birthdayPersonName) {
    const type = 'MOA_INVITE';
    const title = '모아 초대';
    const message = `${inviterName}님이 ${birthdayPersonName}님의 모아에 초대했어요`;
    
    return await this.createNotificationWithAllParams(
      userId, 
      type,
      title, 
      message
    );
  }
}

export const notificationService = new NotificationService();