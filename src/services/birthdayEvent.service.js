import { birthdayEventRepository } from '../repositories/birthdayEvent.repository.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../middlewares/errorHandler.js';

class BirthdayEventService {
  /**
   * 생일 이벤트 상세 정보 조회
   */
  async getEventDetail(userId, options) {
    const { eventId } = options;

    // 1. 이벤트 기본 정보 조회
    const event = await birthdayEventRepository.getEventById(eventId);
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

    // 6. 위시리스트 전체 조회 (스와이프)
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
        list: participants
      },
      wishlist
    };
  }

  /**
   * 전체 위시리스트 조회 (스와이프용 - API 명세서 형식)
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
}

export const birthdayEventService = new BirthdayEventService();