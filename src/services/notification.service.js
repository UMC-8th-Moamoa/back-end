// notification.service.js
import { notificationRepository } from '../repositories/notification.repository.js';
import { NotificationResponseDTO, UnreadNotificationStatusDTO } from '../dtos/notification.dto.js';
import { sendToastNotification } from '../utils/websocket/notificationSocket.js';

/**
 * 알림 관련 비즈니스 로직을 처리하는 Service 클래스
 */
class NotificationService {

  /**
   * 사용자의 알림 목록을 조회합니다
   * @param {number} userId - 사용자 ID
   * @param {Object} params - 조회 조건 { page, size, offset }
   * @returns {Object} 알림 목록과 페이지네이션 정보
   */
  async getNotifications(userId, { page, size, offset }) {
    try {
      // 알림 목록 조회
      const notifications = await notificationRepository.getNotifications(userId, offset, size);
      
      // 전체 알림 개수 조회
      const totalElements = await notificationRepository.getTotalNotificationCount(userId);
      
      // 읽지 않은 알림 존재 여부 확인
      const hasUnreadNotifications = await notificationRepository.hasUnreadNotifications(userId);

      // 페이지네이션 정보 계산
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

      // DTO로 응답 데이터 구성
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

  /**
   * 사용자의 읽지 않은 알림 상태를 확인합니다
   * @param {number} userId - 사용자 ID
   * @returns {Object} 읽지 않은 알림 존재 여부
   */
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

  /**
   * 특정 알림을 읽음 처리합니다
   * @param {number} notificationId - 알림 ID
   * @param {number} userId - 사용자 ID
   * @returns {Object} 성공 메시지
   */
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

  /**
   * 사용자의 모든 알림을 읽음 처리합니다
   * @param {number} userId - 사용자 ID
   * @returns {Object} 성공 메시지와 처리된 알림 개수
   */
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
   * 새로운 알림을 생성합니다 (토스트 알림용)
   * @param {number} userId - 사용자 ID
   * @param {string} message - 알림 메시지
   * @returns {Object} 생성된 알림 정보
   */
  async createNotification(userId, message) {
    try {
      const notification = await notificationRepository.createNotification(
        userId,
        message
      );

      // 실시간 토스트 알림 전송
      await this.sendRealTimeNotification(userId, notification);

      return notification;
    } catch (error) {
      console.error('알림 생성 서비스 오류:', error);
      throw new Error('알림을 생성하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 실시간 토스트 알림 전송
   * @param {number} userId - 사용자 ID
   * @param {Object} notification - 알림 정보
   */
  async sendRealTimeNotification(userId, notification) {
    try {
      // WebSocket을 통한 실시간 토스트 알림 전송
      sendToastNotification(userId, notification);
      
      console.log(`토스트 알림 전송 완료 - 사용자 ${userId}:`, {
        message: notification.message,
        createdAt: notification.createdAt
      });
    } catch (error) {
      console.error('실시간 알림 전송 오류:', error);
      // 실시간 알림 전송 실패는 전체 프로세스를 중단시키지 않음
    }
  }

  /**
   * 모아 관련 알림 생성 (모아모아 서비스에서 호출)
   * @param {number} userId - 사용자 ID
   * @param {string} moaPersonName - 모아 대상자 이름
   * @param {number} amount - 저축 금액
   * @returns {Object} 생성된 알림 정보
   */
  async createMoaSavingNotification(userId, moaPersonName, amount) {
    const message = `${amount.toLocaleString()}원을 ${moaPersonName}님의 모아에 저장했어요`;
    return await this.createNotification(userId, message);
  }

  /**
   * 모아 완료 알림 생성
   * @param {number} userId - 사용자 ID
   * @param {string} moaPersonName - 모아 대상자 이름
   * @param {number} totalAmount - 총 모인 금액
   * @returns {Object} 생성된 알림 정보
   */
  async createMoaCompletedNotification(userId, moaPersonName, totalAmount) {
    const message = `${moaPersonName}님의 모아가 완료되었어요! 총 ${totalAmount.toLocaleString()}원이 모였습니다`;
    return await this.createNotification(userId, message);
  }

  /**
   * 친구 초대 알림 생성
   * @param {number} userId - 사용자 ID
   * @param {string} inviterName - 초대한 사람 이름
   * @param {string} moaPersonName - 모아 대상자 이름
   * @returns {Object} 생성된 알림 정보
   */
  async createMoaInviteNotification(userId, inviterName, moaPersonName) {
    const message = `${inviterName}님이 ${moaPersonName}님의 모아에 초대했어요`;
    return await this.createNotification(userId, message);
  }
}

export const notificationService = new NotificationService();