// notification.dto.js
import { param, query } from 'express-validator';
import { toKSTISOString } from '../utils/datetime.util.js';

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
      type: notification.type || 'SYSTEM',        // 기본값 추가 (안전장치)
      title: notification.title || '알림',        // 기본값 추가 (안전장치)
      message: notification.message || '',        // 빈 문자열 방지
      isRead: notification.isRead || false,       // 기본값 추가
      createdAt: toKSTISOString(notification.createdAt)
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
    this.hasUnreadNotifications = hasUnreadNotifications || false; // 기본값 추가
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

/**
 * 알림 생성 요청 DTO
 */
export class NotificationCreateRequestDTO {
  constructor(bodyData) {
    this.userId = parseInt(bodyData.userId);
    this.type = bodyData.type || 'SYSTEM';
    this.title = bodyData.title || '알림';
    this.message = bodyData.message || '';
  }

  /**
   * 검증된 데이터 반환
   */
  getValidatedData() {
    if (!this.userId || isNaN(this.userId)) {
      throw new Error('유효하지 않은 사용자 ID입니다');
    }

    if (!this.message.trim()) {
      throw new Error('알림 메시지는 필수입니다');
    }

    return {
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message.trim()
    };
  }

  /**
   * express-validator를 사용한 검증 규칙
   */
  static getValidationRules() {
    return [
      body('userId')
        .isInt({ min: 1 })
        .withMessage('사용자 ID는 1 이상의 정수여야 합니다'),
      body('message')
        .notEmpty()
        .withMessage('알림 메시지는 필수입니다')
        .isLength({ max: 1000 })
        .withMessage('알림 메시지는 1000자 이하여야 합니다'),
      body('type')
        .optional()
        .isIn(['SYSTEM', 'MOA_PARTICIPATION', 'MOA_COMPLETED', 'MOA_INVITE', 'BIRTHDAY_REMINDER', 'LETTER_RECEIVED', 'FRIEND_REQUEST'])
        .withMessage('올바른 알림 타입을 선택해주세요'),
      body('title')
        .optional()
        .isLength({ max: 100 })
        .withMessage('알림 제목은 100자 이하여야 합니다')
    ];
  }
}

/**
 * 알림 타입별 조회 요청 DTO
 */
export class NotificationsByTypeRequestDTO {
  constructor(queryData) {
    this.type = queryData.type;
    this.page = parseInt(queryData.page) || 1;
    this.size = parseInt(queryData.size) || 10;
  }

  /**
   * 검증된 데이터 반환
   */
  getValidatedData() {
    const validTypes = ['SYSTEM', 'MOA_PARTICIPATION', 'MOA_COMPLETED', 'MOA_INVITE', 'BIRTHDAY_REMINDER', 'LETTER_RECEIVED', 'FRIEND_REQUEST'];
    
    if (!this.type || !validTypes.includes(this.type)) {
      throw new Error('올바른 알림 타입을 선택해주세요');
    }

    if (this.page < 1) {
      this.page = 1;
    }

    if (this.size < 1) {
      this.size = 10;
    } else if (this.size > 50) {
      this.size = 50;
    }

    return {
      type: this.type,
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
      query('type')
        .notEmpty()
        .withMessage('알림 타입은 필수입니다')
        .isIn(['SYSTEM', 'MOA_PARTICIPATION', 'MOA_COMPLETED', 'MOA_INVITE', 'BIRTHDAY_REMINDER', 'LETTER_RECEIVED', 'FRIEND_REQUEST'])
        .withMessage('올바른 알림 타입을 선택해주세요'),
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

import { body } from 'express-validator';