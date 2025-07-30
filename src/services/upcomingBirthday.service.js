import { upcomingBirthdayRepository } from '../repositories/upcomingBirthday.repository.js';
import { birthdayEventRepository } from '../repositories/birthdayEvent.repository.js';
import { ValidationError, NotFoundError } from '../middlewares/errorHandler.js';

class UpcomingBirthdayService {
  /**
   * 다가오는 친구의 생일 목록 조회 (7일 이내, 스와이프 형식으로 3개씩)
   */
  async getUpcomingBirthdays(userId, options) {
    const { days = 7, limit = 3, cursor = null, direction = 'next' } = options;

    // 커서 디코딩
    let decodedCursor = null;
    if (cursor) {
      try {
        decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString());
      } catch (error) {
        throw new ValidationError('유효하지 않은 커서입니다.');
      }
    }

    // 팔로우한 친구들의 다가오는 생일 조회 (limit + 1개로 다음 페이지 확인)
    const upcomingBirthdays = await upcomingBirthdayRepository.getUpcomingBirthdays(
      userId, 
      days,
      limit + 1,
      decodedCursor,
      direction
    );

    // 페이지네이션 계산
    const hasMore = upcomingBirthdays.length > limit;
    if (hasMore) {
      upcomingBirthdays.pop(); // 마지막 아이템 제거 (페이지네이션 확인용)
    }

    // direction이 prev인 경우 순서 뒤집기
    if (direction === 'prev') {
      upcomingBirthdays.reverse();
    }

    // 각 생일에 대한 이벤트 ID 조회 및 매핑
    const birthdaysWithEvents = await Promise.all(
      upcomingBirthdays.map(async (birthday) => {
        // 해당 생일에 대한 자동 생성된 이벤트 조회
        const event = await birthdayEventRepository.getEventByBirthdayPersonAndDate(
          birthday.friend.id,
          birthday.birthday.date
        );

        return {
          friend: {
            id: birthday.friend.id,
            name: birthday.friend.name,
            photo: birthday.friend.photo
          },
          birthday: {
            date: birthday.birthday.date,
            displayDate: this.formatDisplayDate(birthday.birthday.date),
            dDay: birthday.birthday.dDay
          },
          eventId: event ? event.id : null
        };
      })
    );

    // 페이지네이션 정보 생성
    const pagination = this.createPaginationInfo(
      birthdaysWithEvents, 
      direction, 
      hasMore, 
      cursor
    );

    return {
      upcomingBirthdays: birthdaysWithEvents,
      pagination
    };
  }

  /**
   * 스와이프용 페이지네이션 정보 생성
   */
  createPaginationInfo(data, direction, hasMore, originalCursor) {
    let nextCursor = null;
    let prevCursor = null;
    let hasNext = false;
    let hasPrev = false;

    if (data.length > 0) {
      // direction이 next인 경우
      if (direction === 'next') {
        hasNext = hasMore;
        hasPrev = !!originalCursor; // 커서가 있으면 이전 페이지 존재
        
        if (hasMore) {
          nextCursor = this.createCursor(data[data.length - 1]);
        }
        if (hasPrev) {
          prevCursor = this.createCursor(data[0]);
        }
      } 
      // direction이 prev인 경우
      else if (direction === 'prev') {
        hasPrev = hasMore;
        hasNext = true; // prev로 왔다는 것은 다음 페이지가 있다는 뜻
        
        if (hasMore) {
          prevCursor = this.createCursor(data[0]);
        }
        nextCursor = this.createCursor(data[data.length - 1]);
      }
    }

    return {
      hasNext,
      hasPrev,
      nextCursor,
      prevCursor,
      totalCount: data.length // 현재 페이지의 아이템 수
    };
  }

  /**
   * 커서 생성 (D-Day와 ID 기반)
   */
  createCursor(birthdayItem) {
    return Buffer.from(JSON.stringify({
      id: birthdayItem.friend.id,
      dDay: birthdayItem.birthday.dDay,
      date: birthdayItem.birthday.date
    })).toString('base64');
  }

  /**
   * 생일 날짜를 표시용 형식으로 변환
   */
  formatDisplayDate(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  }

  /**
   * D-Day 계산
   */
  calculateDDay(birthdayDate) {
    const today = new Date();
    const birthday = new Date(birthdayDate);
    
    // 시간을 00:00:00으로 설정
    today.setHours(0, 0, 0, 0);
    birthday.setHours(0, 0, 0, 0);
    
    // 올해 생일 계산
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    thisYearBirthday.setHours(0, 0, 0, 0);
    
    // 올해 생일이 지났으면 내년 생일로 설정
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    // D-Day 계산
    const timeDiff = thisYearBirthday.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysRemaining;
  }

  /**
   * 생일 일주일 전 자동 이벤트 생성
   */
  async createAutoEventsForUpcomingBirthdays() {
    try {
      // 7일 후 생일인 사용자들 조회
      const upcomingBirthdays = await upcomingBirthdayRepository.getBirthdaysAfterDays(7);

      for (const birthday of upcomingBirthdays) {
        // 이미 이벤트가 존재하는지 확인
        const existingEvent = await birthdayEventRepository.getEventByBirthdayPersonAndDate(
          birthday.userId,
          birthday.birthdayDate
        );

        if (!existingEvent) {
          // 자동 이벤트 생성
          await birthdayEventRepository.createAutoEvent({
            birthdayPersonId: birthday.userId,
            title: `${birthday.userName}님의 생일선물`,
            deadline: birthday.birthdayDate,
            autoGenerated: true,
            status: 'active'
          });
        }
      }

      console.log(`자동 생일 이벤트 ${upcomingBirthdays.length}개 처리 완료`);
    } catch (error) {
      console.error('자동 생일 이벤트 생성 실패:', error);
      throw error;
    }
  }
}

export const upcomingBirthdayService = new UpcomingBirthdayService();