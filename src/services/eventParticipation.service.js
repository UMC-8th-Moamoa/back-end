import { eventParticipationRepository } from '../repositories/eventParticipation.repository.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../middlewares/errorHandler.js';

class EventParticipationService {
  /**
   * 이벤트 참여 화면 정보 조회
   */
  async getParticipationInfo(userId, eventId) {
    // 1. 이벤트 존재 확인
    const event = await eventParticipationRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundError('생일 이벤트를 찾을 수 없습니다');
    }

    // 2. 접근 권한 확인 (팔로우 관계 또는 본인)
    const isFollowing = await eventParticipationRepository.isFollowing(
      userId, 
      event.birthdayPersonId
    );
    
    if (!isFollowing && event.birthdayPersonId !== userId) {
      throw new ForbiddenError('이벤트에 접근할 권한이 없습니다');
    }

    // 3. 참여 정보 조회
    const currentUserParticipated = await eventParticipationRepository.isUserParticipating(
      eventId, 
      userId
    );
    const participationCount = await eventParticipationRepository.getParticipantCount(eventId);

    // 4. 편지 작성 여부 확인
    const hasWrittenLetter = await eventParticipationRepository.hasUserWrittenLetter(
      eventId,
      userId
    );

    // 5. 카운트다운 계산
    const countdown = this.calculateCountdown(event.deadline);

    // 6. Status에 따른 버튼 분류
    const buttonStatus = this.determineButtonStatus(event, currentUserParticipated, hasWrittenLetter);

    return {
      event: {
        id: event.id,
        birthdayPersonName: event.birthdayPerson.name,
        deadline: event.deadline,
        status: event.status
      },
      countdown,
      participation: {
        currentUserParticipated,
        participationCount,
        hasWrittenLetter
      },
      buttonStatus
    };
  }

  /**
   * 이벤트 참여 (송금하고/송금없이)
   */
  async participateInEvent(userId, options) {
    const { eventId, participationType, amount } = options;

    // 1. 이벤트 존재 확인
    const event = await eventParticipationRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundError('생일 이벤트를 찾을 수 없습니다');
    }

    // 2. 본인 생일 이벤트 참여 방지
    if (event.birthdayPersonId === userId) {
      throw new ValidationError('본인의 생일 이벤트에는 참여할 수 없습니다');
    }

    // 3. 접근 권한 확인
    const isFollowing = await eventParticipationRepository.isFollowing(
      userId, 
      event.birthdayPersonId
    );
    
    if (!isFollowing) {
      throw new ForbiddenError('이벤트에 참여할 권한이 없습니다');
    }

    // 4. 이벤트 활성 상태 확인
    const isActive = await eventParticipationRepository.isEventActive(eventId);
    if (!isActive) {
      throw new ValidationError('마감된 이벤트입니다');
    }

    // 5. 이미 참여했는지 확인
    const alreadyParticipated = await eventParticipationRepository.isUserParticipating(
      eventId, 
      userId
    );
    if (alreadyParticipated) {
      throw new ValidationError('이미 참여한 이벤트입니다');
    }

    // 6. 참여 추가
    const participation = await eventParticipationRepository.addParticipation(
      eventId,
      userId,
      amount,
      participationType
    );

    // 7. 송금이 있는 경우 이벤트 금액 업데이트
    if (participationType === 'WITH_MONEY' && amount > 0) {
      await eventParticipationRepository.updateEventCurrentAmount(eventId, amount);
    }

    // 8. 현재 이벤트 상태 조회
    const eventStatus = await eventParticipationRepository.getEventStatus(eventId);

    return {
      participation: {
        id: participation.id,
        eventId: participation.eventId,
        userId: participation.userId,
        amount: participation.amount,
        participationType: participation.participationType,
        participatedAt: participation.participatedAt
      },
      event: eventStatus
    };
  }

  /**
   * Status에 따른 버튼 상태 결정
   */
  determineButtonStatus(event, currentUserParticipated, hasWrittenLetter) {
    const now = new Date();
    const deadline = new Date(event.deadline);
    const isExpired = now > deadline;

    // 이벤트 상태별 버튼 분류
    switch (event.status.toLowerCase()) {
      case 'active':
        if (isExpired) {
          return {
            type: 'EXPIRED',
            message: '마감된 이벤트입니다',
            buttonText: null,
            buttonAction: 'NONE',
            isEnabled: false
          };
        }
        
        // 참여하지 않은 경우: "모아 참여하기" 버튼
        if (!currentUserParticipated) {
          return {
            type: 'NOT_PARTICIPATED',
            message: '이벤트에 참여해보세요',
            buttonText: '모아 참여하기',
            buttonAction: 'PARTICIPATE',
            isEnabled: true
          };
        }

        // 참여했지만 편지를 작성하지 않은 경우: "편지 작성하러 가기" 버튼
        if (currentUserParticipated && !hasWrittenLetter) {
          return {
            type: 'PARTICIPATED_NO_LETTER',
            message: '편지를 작성해주세요',
            buttonText: '편지 작성하러 가기',
            buttonAction: 'WRITE_LETTER',
            isEnabled: true
          };
        }

        // 참여했고 편지도 작성한 경우: "편지 수정하기" 버튼
        if (currentUserParticipated && hasWrittenLetter) {
          return {
            type: 'PARTICIPATED_WITH_LETTER',
            message: '편지 작성 완료',
            buttonText: '편지 수정하기',
            buttonAction: 'EDIT_LETTER',
            isEnabled: true
          };
        }

        break;

      case 'closed':
        return {
          type: 'CLOSED',
          message: '종료된 이벤트입니다',
          buttonText: null,
          buttonAction: 'NONE',
          isEnabled: false
        };

      case 'completed':
        return {
          type: 'COMPLETED',
          message: '완료된 이벤트입니다',
          buttonText: null,
          buttonAction: 'NONE',
          isEnabled: false
        };

      case 'cancelled':
        return {
          type: 'CANCELLED',
          message: '취소된 이벤트입니다',
          buttonText: null,
          buttonAction: 'NONE',
          isEnabled: false
        };

      default:
        // 알 수 없는 상태의 경우 안전하게 비활성화
        return {
          type: 'UNKNOWN',
          message: '알 수 없는 이벤트 상태입니다',
          buttonText: null,
          buttonAction: 'NONE',
          isEnabled: false
        };
    }
  }

  /**
   * 마감시간까지 남은 시간 계산 (HH:MM:SS 형식)
   */
  calculateCountdown(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    // 남은 시간 계산 (밀리초)
    const timeDiff = deadlineDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return {
        timeRemaining: "00:00:00",
        deadlineFormatted: this.formatDeadline(deadlineDate)
      };
    }
    
    // 총 시간으로 변환
    const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    // HH:MM:SS 형식으로 포맷팅
    const timeRemaining = `${totalHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    return {
      timeRemaining,
      deadlineFormatted: this.formatDeadline(deadlineDate)
    };
  }

  /**
   * 마감일 포맷팅 (ex: 8월 23일 23:59)
   */
  formatDeadline(deadline) {
    const month = deadline.getMonth() + 1;
    const day = deadline.getDate();
    const hours = deadline.getHours();
    const minutes = deadline.getMinutes();
    
    return `${month}월 ${day}일 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

export const eventParticipationService = new EventParticipationService();