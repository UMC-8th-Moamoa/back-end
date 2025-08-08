import { myBirthdayRepository } from '../repositories/myBirthday.repository.js';
import { NotFoundError, ValidationError } from '../middlewares/errorHandler.js';

/**
 * 내 생일 이벤트 서비스
 */
class MyBirthdayService {
  /**
   * 완료된 생일 이벤트 정보 조회 (최종 결과 조회)
   * @param {number} userId - 생일자 사용자 ID
   * @returns {Object} 이벤트 정보
   */
  async getCurrentEvent(userId) {
    try {
      // 완료된 이벤트 조회
      const event = await myBirthdayRepository.getCurrentEventByUserId(userId);
      
      if (!event) {
        throw new NotFoundError('완료된 생일 이벤트가 없습니다');
      }

      // 참여자 정보 조회
      const participants = await myBirthdayRepository.getEventParticipants(event.id);
      
      // 완료된 이벤트이므로 남은 일수는 0
      const daysRemaining = 0;
      
      // 총 모인 금액 계산
      const totalAmount = await myBirthdayRepository.getTotalAmount(event.id);

      return {
        eventId: event.id,
        totalAmount,
        participantCount: participants.length,
        participants: participants.map(participant => ({
          id: participant.userId,
          name: participant.user.name,
          photo: participant.user.photo,
          participatedAt: participant.createdAt
        })),
        deadline: event.deadline,
        daysRemaining,
        birthdayDate: event.birthdayDate,
        status: event.status,
        completedAt: event.updatedAt
      };

    } catch (error) {
      console.error('완료된 이벤트 조회 서비스 오류:', error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new Error('완료된 이벤트 정보를 가져오는 중 오류가 발생했습니다');
    }
  }

  /**
   * 마감일까지 남은 일수 계산
   * @param {Date} deadline - 마감일
   * @returns {number} 남은 일수
   */
  calculateDaysRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff); // 음수가 되지 않도록 처리
  }

  /**
   * 이벤트 상태 유효성 검사
   * @param {string} status - 이벤트 상태
   * @returns {boolean} 유효성 여부
   */
  validateEventStatus(status) {
    const validStatuses = ['active', 'completed', 'cancelled'];
    return validStatuses.includes(status);
  }
}

export const myBirthdayService = new MyBirthdayService();