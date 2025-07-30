import { eventShareRepository } from '../repositories/eventShare.repository.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../middlewares/errorHandler.js';

class EventShareService {
  /**
   * 이벤트 공유 URL 생성
   */
  async createShareUrl(userId, options) {
    const { eventId, contentType, expiresAt } = options;

    // 1. 이벤트 존재 확인
    const event = await eventShareRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundError('생일 이벤트를 찾을 수 없습니다');
    }

    // 2. 접근 권한 확인 (팔로우 관계 또는 본인)
    const isFollowing = await eventShareRepository.isFollowing(
      userId, 
      event.birthdayPersonId
    );
    
    if (!isFollowing && event.birthdayPersonId !== userId) {
      throw new ForbiddenError('이벤트를 공유할 권한이 없습니다');
    }

    // 3. 이벤트 활성 상태 확인
    if (event.status !== 'active') {
      throw new ValidationError('활성 상태가 아닌 이벤트는 공유할 수 없습니다');
    }

    // 4. 만료 시간이 이벤트 마감 시간을 넘지 않도록 확인
    const eventDeadline = new Date(event.deadline);
    const shareExpiresAt = new Date(expiresAt);
    
    if (shareExpiresAt > eventDeadline) {
      throw new ValidationError('공유 링크 만료 시간은 이벤트 마감 시간을 넘을 수 없습니다');
    }

    // 5. 공유 토큰 생성
    const shareToken = await eventShareRepository.createShareToken(eventId, expiresAt);

    // 6. 공유 URL 및 텍스트 생성
    const shareUrl = this.generateShareUrl(eventId, shareToken);
    const shareText = this.generateShareText(event.birthdayPerson.name, event.deadline);

    return {
      shareUrl,
      shareText,
      expiresAt
    };
  }

  /**
   * 공유 URL 생성
   */
  generateShareUrl(eventId, token) {
    const baseUrl = process.env.FRONTEND_BASE_URL || 'https://moamoa.app';
    return `${baseUrl}/events/${eventId}/join?token=${token}`;
  }

  /**
   * 공유 텍스트 생성
   */
  generateShareText(birthdayPersonName, deadline) {
    const deadlineDate = new Date(deadline);
    const month = deadlineDate.getMonth() + 1;
    const day = deadlineDate.getDate();
    
    return `${birthdayPersonName}님의 생일 모아모아에 참여해주세요!\n마감: ${month}월 ${day}일`;
  }

  /**
   * 공유 토큰으로 이벤트 정보 조회 (공유 링크 접속 시 사용)
   */
  async getEventByShareToken(token) {
    const event = await eventShareRepository.getEventByShareToken(token);
    
    if (!event) {
      throw new NotFoundError('유효하지 않거나 만료된 공유 링크입니다');
    }

    return {
      eventId: event.id,
      birthdayPersonName: event.birthdayPerson.name,
      deadline: event.deadline,
      status: event.status
    };
  }

  /**
   * 만료된 공유 토큰 정리 (배치 작업용)
   */
  async cleanupExpiredShareTokens() {
    try {
      const cleanedCount = await eventShareRepository.cleanupExpiredTokens();
      console.log(`만료된 공유 토큰 ${cleanedCount}개 정리 완료`);
      return cleanedCount;
    } catch (error) {
      console.error('공유 토큰 정리 실패:', error);
      throw error;
    }
  }
}

export const eventShareService = new EventShareService();