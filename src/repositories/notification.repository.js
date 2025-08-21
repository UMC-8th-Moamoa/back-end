// notification.repository.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 알림 관련 데이터베이스 작업을 담당하는 Repository 클래스
 */
class NotificationRepository {
  
  /**
   * 사용자의 알림 목록을 페이지네이션으로 조회
   * @param {number} userId - 사용자 ID
   * @param {number} offset - 건너뛸 개수
   * @param {number} size - 가져올 개수
   * @returns {Array} 알림 목록
   */
  async getNotifications(userId, offset, size) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc' // 최신 알림부터
        },
        skip: offset,
        take: size,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true
        }
      });

      return notifications;
    } catch (error) {
      console.error('알림 목록 조회 중 오류 발생:', error);
      throw new Error('알림 목록을 조회하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 사용자의 전체 알림 개수 조회
   * @param {number} userId - 사용자 ID
   * @returns {number} 전체 알림 개수
   */
  async getTotalNotificationCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId
        }
      });

      return count;
    } catch (error) {
      console.error('전체 알림 개수 조회 중 오류 발생:', error);
      throw new Error('전체 알림 개수를 조회하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 사용자에게 읽지 않은 알림이 있는지 확인
   * @param {number} userId - 사용자 ID
   * @returns {boolean} 읽지 않은 알림 존재 여부
   */
  async hasUnreadNotifications(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      });

      return count > 0;
    } catch (error) {
      console.error('읽지 않은 알림 확인 중 오류 발생:', error);
      throw new Error('읽지 않은 알림을 확인하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 특정 알림을 읽음 처리
   * @param {number} notificationId - 알림 ID
   * @param {number} userId - 사용자 ID (권한 확인용)
   * @returns {Object} 업데이트된 알림 정보
   */
  async markNotificationAsRead(notificationId, userId) {
    try {
      // 먼저 해당 알림이 사용자의 것인지 확인
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      if (!notification) {
        throw new Error('해당 알림을 찾을 수 없습니다');
      }

      // 이미 읽음 처리된 알림인 경우
      if (notification.isRead) {
        return notification;
      }

      // 읽음 처리
      const updatedNotification = await prisma.notification.update({
        where: {
          id: notificationId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return updatedNotification;
    } catch (error) {
      console.error('알림 읽음 처리 중 오류 발생:', error);
      if (error.message === '해당 알림을 찾을 수 없습니다') {
        throw error;
      }
      throw new Error('알림을 읽음 처리하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 사용자의 모든 알림을 읽음 처리
   * @param {number} userId - 사용자 ID
   * @returns {number} 업데이트된 알림 개수
   */
  async markAllNotificationsAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return result.count;
    } catch (error) {
      console.error('모든 알림 읽음 처리 중 오류 발생:', error);
      throw new Error('모든 알림을 읽음 처리하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 새로운 알림 생성 (기본 버전 - 메시지만)
   * @param {number} userId - 사용자 ID
   * @param {string} message - 알림 메시지
   * @returns {Object} 생성된 알림 정보
   */
  async createNotification(userId, type, title, message) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: userId,
          type: type,
          title: title,
          message: message,
          isRead: false
        }
      });

      return notification;
    } catch (error) {
      console.error('알림 생성 중 오류 발생:', error);
      throw new Error('알림을 생성하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 새로운 알림 생성 (확장 버전 - 타입과 제목 포함)
   * @param {number} userId - 사용자 ID
   * @param {string} type - 알림 타입
   * @param {string} title - 알림 제목
   * @param {string} message - 알림 메시지
   * @returns {Object} 생성된 알림 정보
   */
  async createNotificationWithType(userId, type, title, message) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: userId,
          type: type,
          title: title,
          message: message,
          isRead: false
        }
      });

      return notification;
    } catch (error) {
      console.error('알림 생성 중 오류 발생:', error);
      throw new Error('알림을 생성하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 타입별 알림 조회
   * @param {number} userId - 사용자 ID
   * @param {string} type - 알림 타입
   * @param {number} offset - 건너뛸 개수
   * @param {number} size - 가져올 개수
   * @returns {Array} 타입별 알림 목록
   */
  async getNotificationsByType(userId, type, offset, size) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: userId,
          type: type
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: size,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true
        }
      });

      return notifications;
    } catch (error) {
      console.error('타입별 알림 조회 중 오류 발생:', error);
      throw new Error('타입별 알림을 조회하는 중 오류가 발생했습니다');
    }
  }
}

export const notificationRepository = new NotificationRepository();