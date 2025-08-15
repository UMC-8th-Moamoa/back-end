import { birthdayEventRepository } from '../repositories/birthdayEvent.repository.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../middlewares/errorHandler.js';

class BirthdayEventService {
  /**
   * 생일 이벤트 상세 정보 조회
   */
  async getEventDetail(userId, options) {
    const { eventId } = options;

    // 1. 이벤트 기본 정보 조회
    const event = await birthdayEventRepository.findEventById(eventId);
    if (!event) {
      throw new NotFoundError('생일 이벤트를 찾을 수 없습니다');
    }

    // 2. 이벤트 접근 권한 확인 (팔로우 관계 확인)
    const isFollowing = await birthdayEventRepository.isFollowing(
      userId, 
      event.birthdayPersonId
    );
    
    if (!isFollowing && event.birthdayPersonId !== userId) {
      throw new ForbiddenError('이벤트에 접근할 권한이 없습니다');
    }

    // 3. 생일자 정보 조회
    const birthdayPerson = await birthdayEventRepository.getUserById(
      event.birthdayPersonId
    );

    // 4. 카운트다운 정보 계산
    const countdown = this.calculateCountdown(birthdayPerson.birthday);

    // 5. 참여자 목록 조회
    const participants = await birthdayEventRepository.getParticipants(eventId);

    // 6. 현재 사용자 참여 여부 확인
    const currentUserParticipated = participants.some(p => p.userId === userId);

    // 7. 버튼 상태 결정 (event에 birthdayPersonId 추가)
    const eventWithOwner = { ...event, birthdayPersonId: event.birthdayPersonId };
    const buttonInfo = this.determineButtonState(eventWithOwner, userId, currentUserParticipated, countdown);

    // 8. 위시리스트 전체 조회 (스와이프)
    const wishlist = await this.getAllWishlist(event.birthdayPersonId);

    return {
      currentUserId: userId,
      event: {
        id: event.id,
        deadline: event.deadline,
        status: event.status,
        createdAt: event.createdAt
      },
      birthdayPerson: {
        id: birthdayPerson.id,
        name: birthdayPerson.name,
        photo: birthdayPerson.photo,
        birthday: birthdayPerson.birthday
      },
      countdown,
      participants: {
        totalCount: participants.length,
        currentUserParticipated,
        list: participants
      },
      buttonInfo, // 버튼 상태 정보 추가
      wishlist
    };
  }

  /**
   * 전체 위시리스트 조회 (스와이프용)
   */
  async getAllWishlist(userId) {
    try {
      // 전체 위시리스트 개수 조회
      const totalCount = await birthdayEventRepository.getWishlistCount(userId);
      
      if (totalCount === 0) {
        return null; // 위시리스트가 없으면 null 반환
      }

      // 모든 위시리스트 아이템 조회
      const items = await birthdayEventRepository.getAllWishlistItems(userId);

      // API 명세서 형식에 맞게 데이터 변환
      const formattedItems = items.map(item => ({
        id: item.id,
        name: item.productName,
        price: item.price,
        image: item.productImageUrl,
        isPublic: true // 공개된 위시리스트만 조회하므로 항상 true
      }));

      return {
        totalCount,
        items: formattedItems
      };
    } catch (error) {
      console.error('위시리스트 조회 실패:', error);
      return null; // 에러 발생 시 null 반환 (위시리스트는 필수가 아님)
    }
  }

  /**
   * 버튼 상태 결정
   * @param {Object} event - 이벤트 정보
   * @param {number} userId - 현재 사용자 ID
   * @param {boolean} currentUserParticipated - 현재 사용자 참여 여부
   * @param {Object} countdown - 카운트다운 정보
   * @returns {Object} 버튼 상태 정보
   */
  determineButtonState(event, userId, currentUserParticipated, countdown) {
    const isOwner = event.birthdayPersonId === userId;
    const isExpired = new Date() > new Date(event.deadline);
    const isCompleted = event.status === 'completed';

    // 본인의 생일 이벤트인 경우
    if (isOwner) {
      if (isCompleted) {
        return {
          type: 'VIEW_RESULT',
          text: '모아 결과보기',
          description: '완료된 생일 이벤트 결과를 확인하세요',
          actionUrl: `/api/birthdays/me/event`, // ✅ 내 생일 결과 조회 API (통일된 구조)
          disabled: false
        };
      } else {
        return {
          type: 'OWNER_WAITING',
          text: '모아 진행중',
          description: '친구들의 참여를 기다리는 중입니다',
          actionUrl: null,
          disabled: true
        };
      }
    }

    // 다른 사람의 생일 이벤트인 경우
    if (isCompleted || isExpired) {
      return {
        type: 'EVENT_ENDED',
        text: '이벤트 종료',
        description: '이벤트가 종료되었습니다',
        actionUrl: null, // 다른 사람의 결과는 조회할 수 없음
        disabled: true
      };
    }

    if (currentUserParticipated) {
      return {
        type: 'PARTICIPATED',
        text: '모아 참여 완료',
        description: '이미 참여하셨습니다',
        actionUrl: null,
        disabled: true
      };
    }

    // 아직 참여하지 않은 활성 이벤트
    return {
      type: 'PARTICIPATE',
      text: '모아 참여하기',
      description: `${countdown.formattedDaysRemaining}까지 참여 가능`,
      actionUrl: `/api/birthdays/events/${event.id}/participation`, // ✅ 참여하기 API
      disabled: false
    };
  }

  /**
   * 생일까지 남은 일수 계산
   */
  calculateCountdown(birthdayDate) {
    const today = new Date();
    const birthday = new Date(birthdayDate);
    
    // 시간을 00:00:00으로 설정
    today.setHours(0, 0, 0, 0);
    
    // 올해 생일 계산
    let thisYearBirthday = new Date(
      today.getFullYear(), 
      birthday.getMonth(), 
      birthday.getDate()
    );
    thisYearBirthday.setHours(0, 0, 0, 0);
    
    // 올해 생일이 지났으면 내년 생일로 설정
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    // 남은 일수 계산
    const timeDiff = thisYearBirthday.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // 생일 당일 확인
    const isBirthdayToday = daysRemaining === 0;
    
    // 포맷팅
    const formattedDaysRemaining = this.formatDaysRemaining(daysRemaining, isBirthdayToday);

    return {
      daysRemaining,
      formattedDaysRemaining,
      isBirthdayToday
    };
  }

  /**
   * D-Day 형식으로 포맷팅
   */
  formatDaysRemaining(days, isBirthdayToday) {
    if (isBirthdayToday) {
      return 'D-DAY';
    }
    return `D-${days}`;
  }

  /**
   * 날짜를 표시용 형식으로 변환
   */
  formatDisplayDate(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  }

  /**
   * 내 생일 이벤트 결과 조회
   * @param {number} userId - 현재 사용자 ID (생일자)
   * @returns {Object} 내 생일 이벤트 결과 정보
   */
  async getMyEventResult(userId) {
    // MyBirthdayRepository를 import해서 사용
    const { myBirthdayRepository } = await import('../repositories/myBirthday.repository.js');
    
    // 완료된 이벤트 조회
    const event = await myBirthdayRepository.getCurrentEventByUserId(userId);
    
    if (!event) {
      throw new NotFoundError('완료된 생일 이벤트가 없습니다');
    }

    // 참여자 정보 조회
    const participants = await myBirthdayRepository.getEventParticipants(event.id);
    
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
      birthdayDate: event.birthdayDate,
      status: event.status,
      completedAt: event.updatedAt
    };
  }
}

export const birthdayEventService = new BirthdayEventService();