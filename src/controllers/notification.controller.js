// notification.controller.js
import { notificationService } from '../services/notification.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { 
  NotificationListRequestDTO, 
  NotificationReadRequestDTO 
} from '../dtos/notification.dto.js';
import { BadRequestError, NotFoundError } from '../middlewares/errorHandler.js';

/**
 * 알림 관련 HTTP 요청을 처리하는 Controller 클래스
 */
class NotificationController {

  /**
   * 사용자의 알림 목록을 조회합니다
   * GET /api/notifications
   */
  async getNotifications(req, res) {
    const userId = req.user.id; // JWT에서 추출한 사용자 ID
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new NotificationListRequestDTO(req.query);
    const { page, size, offset } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const notificationData = await notificationService.getNotifications(userId, {
      page,
      size,
      offset
    });

    res.success(notificationData);
  }

  /**
   * 사용자의 읽지 않은 알림 상태를 확인합니다
   * GET /api/notifications/unread-status
   */
  async getUnreadNotificationStatus(req, res) {
    const userId = req.user.id; // JWT에서 추출한 사용자 ID
    
    // 서비스 레이어 호출
    const statusData = await notificationService.getUnreadNotificationStatus(userId);

    res.success(statusData);
  }

  /**
   * 특정 알림을 읽음 처리합니다
   * PATCH /api/notifications/:notificationId/read
   */
  async markNotificationAsRead(req, res) {
    const userId = req.user.id; // JWT에서 추출한 사용자 ID
    
    try {
      // 요청 데이터를 DTO로 변환 및 검증
      const requestDTO = new NotificationReadRequestDTO(req.params);
      const { notificationId } = requestDTO.getValidatedData();

      // 서비스 레이어 호출
      const result = await notificationService.markNotificationAsRead(notificationId, userId);

      res.success(result);
    } catch (error) {
      if (error.message === '유효하지 않은 알림 ID입니다') {
        throw new BadRequestError(error.message);
      }
      if (error.message === '해당 알림을 찾을 수 없습니다') {
        throw new NotFoundError(error.message);
      }
      throw error;
    }
  }

  /**
   * 사용자의 모든 알림을 읽음 처리합니다
   * PATCH /api/notifications/read-all
   */
  async markAllNotificationsAsRead(req, res) {
    const userId = req.user.id; // JWT에서 추출한 사용자 ID
    
    // 서비스 레이어 호출
    const result = await notificationService.markAllNotificationsAsRead(userId);

    res.success(result);
  }

  /**
   * 새로운 알림을 생성합니다 (시스템 내부용 - 관리자 또는 시스템 호출)
   * POST /api/notifications
   */
  async createNotification(req, res) {
    const { userId, message } = req.body;

    // 입력 데이터 검증
    if (!userId || !message) {
      throw new BadRequestError('모든 필드를 입력해주세요 (userId, message)');
    }

    // 서비스 레이어 호출
    const notification = await notificationService.createNotification(
      userId,
      message
    );

    res.success({
      message: '알림이 성공적으로 생성되었습니다.',
      notification: {
        id: notification.id,
        message: notification.message,
        createdAt: notification.createdAt
      }
    });
  }
}

const notificationController = new NotificationController();

// catchAsync로 감싸서 에러 처리 미들웨어에서 처리하도록 함
export default {
  getNotifications: catchAsync(notificationController.getNotifications),
  getUnreadNotificationStatus: catchAsync(notificationController.getUnreadNotificationStatus),
  markNotificationAsRead: catchAsync(notificationController.markNotificationAsRead),
  markAllNotificationsAsRead: catchAsync(notificationController.markAllNotificationsAsRead),
  createNotification: catchAsync(notificationController.createNotification)
};