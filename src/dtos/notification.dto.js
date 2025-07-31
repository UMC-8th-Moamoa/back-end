// notification.dto.js
import { param, query } from 'express-validator';

/**
 * 알림 목록 조회 요청 DTO
 */
export class NotificationListRequestDTO {
  constructor(queryData) {
    this.page = parseInt(queryData.page) || 1;
    this.size = parseInt(queryData.size) || 10;
  }

  /**
   * 검증된 데이터 반환
   */
  getValidatedData() {
    // 페이지 번호는 1 이상이어야 함
    if (this.page < 1) {
      this.page = 1;
    }

    // 한 페이지당 알림 개수는 1~50 사이여야 함
    if (this.size < 1) {
      this.size = 10;
    } else if (this.size > 50) {
      this.size = 50;
    }

    return {
      page: this.page,
      size: this.size,
      offset: (this.page - 1) * this.size
    };
  }

  /**
   * express-validator를 사용한 검증 규칙
   */
  static getValidationRules() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('페이지 번호는 1 이상의 정수여야 합니다'),
      query('size')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('한 페이지당 알림 개수는 1~50 사이의 정수여야 합니다')
    ];
  }
}

/**
 * 알림 응답 DTO
 */
export class NotificationResponseDTO {
  constructor(notifications, pagination, hasUnreadNotifications = false) {
    this.notifications = notifications.map(notification => ({
      id: notification.id,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString()
    }));
    this.pagination = pagination;
    this.hasUnreadNotifications = hasUnreadNotifications;
  }

  /**
   * API 응답 형태로 변환
   */
  toResponse() {
    return {
      notifications: this.notifications,
      pagination: this.pagination,
      hasUnreadNotifications: this.hasUnreadNotifications
    };
  }
}

/**
 * 읽지 않은 알림 상태 응답 DTO
 */
export class UnreadNotificationStatusDTO {
  constructor(hasUnreadNotifications) {
    this.hasUnreadNotifications = hasUnreadNotifications;
  }

  /**
   * API 응답 형태로 변환
   */
  toResponse() {
    return {
      hasUnreadNotifications: this.hasUnreadNotifications
    };
  }
}

/**
 * 알림 읽음 처리 요청 DTO
 */
export class NotificationReadRequestDTO {
  constructor(params) {
    this.notificationId = parseInt(params.notificationId);
  }

  /**
   * 검증된 데이터 반환
   */
  getValidatedData() {
    if (!this.notificationId || isNaN(this.notificationId)) {
      throw new Error('유효하지 않은 알림 ID입니다');
    }

    return {
      notificationId: this.notificationId
    };
  }

  /**
   * express-validator를 사용한 검증 규칙
   */
  static getValidationRules() {
    return [
      param('notificationId')
        .isInt({ min: 1 })
        .withMessage('알림 ID는 1 이상의 정수여야 합니다')
    ];
  }
}