import { letterHomeRepository } from '../repositories/letterHome.repository.js';
import { ValidationError } from '../middlewares/errorHandler.js';
import { toKSTISOString, formatDateToKST } from '../utils/datetime.util.js';

class LetterHomeService {
  /**
   * 홈 화면 편지 목록 조회 (스와이프 형식으로 3개씩)
   */
  async getLetters(userId, options) {
    const { limit = 3, cursor = null, direction = 'next' } = options;

    // 커서 디코딩
    let decodedCursor = null;
    if (cursor) {
      try {
        decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString());
        
        // 디코딩된 커서의 필수 필드 검증
        if (!decodedCursor || !decodedCursor.id || !decodedCursor.createdAt) {
          throw new Error('Invalid cursor structure');
        }
        
        // createdAt이 유효한 날짜인지 확인
        const testDate = new Date(decodedCursor.createdAt);
        if (isNaN(testDate.getTime())) {
          throw new Error('Invalid cursor date');
        }
        
        // id가 숫자인지 확인
        if (isNaN(parseInt(decodedCursor.id))) {
          throw new Error('Invalid cursor id');
        }
        
      } catch (error) {
        console.error('Cursor decode error:', error);
        throw new ValidationError('유효하지 않은 커서입니다: ' + error.message);
      }
    }

    // 사용자가 참여 중인 생일 이벤트와 편지 정보 조회 (limit + 1개로 다음 페이지 확인)
    const events = await letterHomeRepository.getBirthdayEventsWithLetters(
      userId,
      limit + 1,
      decodedCursor,
      direction
    );

    // 페이지네이션 계산
    const hasMore = events.length > limit;
    if (hasMore) {
      events.pop(); // 마지막 아이템 제거 (페이지네이션 확인용)
    }

    // direction이 prev인 경우 순서 뒤집기
    if (direction === 'prev') {
      events.reverse();
    }

    // 응답 데이터 변환
    const letters = events.map(event => ({
      birthdayEventId: event.id,
      birthdayPersonName: event.birthdayPersonName,
      birthdayPersonPhoto: event.birthdayPersonPhoto,
      birthday: this.formatDisplayDate(event.birthdayPersonBirthday),
      hasLetter: event.hasLetter,
      letterId: event.letterId,
      lastModified: event.lastModified ? toKSTISOString(event.lastModified) : null,
      daysLeft: this.calculateDaysLeft(event.birthdayPersonBirthday)
    }));

    // 페이지네이션 정보 생성
    const pagination = this.createPaginationInfo(
      events, 
      direction, 
      hasMore, 
      cursor
    );

    return {
      letters,
      pagination
    };
  }

  /**
   * 스와이프용 페이지네이션 정보 생성
   */
  createPaginationInfo(events, direction, hasMore, originalCursor) {
    let nextCursor = null;
    let prevCursor = null;
    let hasNext = false;
    let hasPrev = false;

    if (events.length > 0) {
      // direction이 next인 경우
      if (direction === 'next') {
        hasNext = hasMore;
        hasPrev = !!originalCursor; // 커서가 있으면 이전 페이지 존재
        
        if (hasMore) {
          nextCursor = this.createCursor(events[events.length - 1]);
        }
        if (hasPrev) {
          prevCursor = this.createCursor(events[0]);
        }
      } 
      // direction이 prev인 경우
      else if (direction === 'prev') {
        hasPrev = hasMore;
        hasNext = true; // prev로 왔다는 것은 다음 페이지가 있다는 뜻
        
        if (hasMore) {
          prevCursor = this.createCursor(events[0]);
        }
        nextCursor = this.createCursor(events[events.length - 1]);
      }
    }

    return {
      hasNext,
      hasPrev,
      nextCursor,
      prevCursor
    };
  }

  /**
   * 커서 생성 (이벤트 ID와 생성시간 기반)
   */
  createCursor(event) {
    return Buffer.from(JSON.stringify({
      id: event.id,
      createdAt: event.createdAt
    })).toString('base64');
  }

  /**
   * 생일 날짜를 표시용 형식으로 변환
   */
  formatDisplayDate(dateString) {
    try {
      if (!dateString) return null;
      const date = new Date(dateString);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    } catch (error) {
      return null;
    }
  }

  /**
   * 생일까지 남은 일수 계산
   */
  calculateDaysLeft(birthday) {
    try {
      if (!birthday) return 0;

      const today = new Date();
      const birthdayDate = new Date(birthday);
      
      // 시간을 00:00:00으로 설정
      today.setHours(0, 0, 0, 0);
      
      // 올해 생일 계산
      const thisYearBirthday = new Date(today.getFullYear(), birthdayDate.getMonth(), birthdayDate.getDate());
      thisYearBirthday.setHours(0, 0, 0, 0);
      
      // 올해 생일이 지났으면 내년 생일로 설정
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      // D-Day 계산
      const timeDiff = thisYearBirthday.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return Math.max(0, daysRemaining);
    } catch (error) {
      return 0;
    }
  }
}

export const letterHomeService = new LetterHomeService();