import { letterHomeRepository } from '../repositories/letterHome.repository.js';
import { ValidationError } from '../middlewares/errorHandler.js';
import { toKSTISOString, formatDateToKST } from '../utils/datetime.util.js';

// 편지 홈 화면 관련 비즈니스 로직
class LetterHomeService {
// 홈 화면 편지 목록 조회

  async getLetters(userId, { limit, cursor, direction }) {
    // 커서 디코딩
    let decodedCursor = null;
    if (cursor) {
      try {
        decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString());
      } catch (error) {
        throw new ValidationError('유효하지 않은 커서입니다.');
      }
    }

    // 사용자가 참여 중인 생일 이벤트와 편지 정보 조회
    const events = await letterHomeRepository.getBirthdayEventsWithLetters(userId, {
      limit: limit + 1, // 다음 페이지 존재 여부 확인용
      cursor: decodedCursor,
      direction
    });

    // 페이지네이션 계산
    const hasMore = events.length > limit;
    if (hasMore) {
      events.pop(); // 마지막 아이템 제거 (다음 페이지 확인용)
    }

    // direction이 prev인 경우 결과 순서 뒤집기
    if (direction === 'prev') {
      events.reverse();
    }

    // 응답 데이터 변환
    const letters = events.map(event => ({
      birthdayEventId: event.id,
      birthdayPersonName: event.birthdayPerson.name,
      birthdayPersonPhoto: event.birthdayPerson.photo,
      birthday: this.formatDate(event.birthdayPerson.birthday),
      hasLetter: !!event.userLetter,
      letterId: event.userLetter?.id || null,
      lastModified: event.userLetter?.updatedAt ? toKSTISOString(event.userLetter.updatedAt) : null,
      daysLeft: this.calculateDaysLeft(event.birthdayPerson.birthday)
    }));

    // 커서 생성
    const pagination = this.createPagination(events, direction, hasMore, cursor);

    return {
      letters,
      pagination
    };
  }


// 생일까지 남은 일수 계산
  calculateDaysLeft(birthday) {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // 올해 생일
    const thisYearBirthday = new Date(
      currentYear,
      birthday.getMonth(),
      birthday.getDate()
    );

    // 만약 올해 생일이 지났다면 내년 생일로 계산
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(currentYear + 1);
    }

    // 밀리초를 일수로 변환
    const diffTime = thisYearBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

// 날짜 포맷팅 (YYYY-MM-DD)

  formatDate(date) {
    return formatDateToKST(date);
  }

// 페이지네이션 정보 생성
  createPagination(events, direction, hasMore, originalCursor) {
    let nextCursor = null;
    let prevCursor = null;
    let hasNext = false;
    let hasPrev = false;

    if (events.length > 0) {
      // direction이 next인 경우
      if (direction === 'next') {
        hasNext = hasMore;
        hasPrev = !!originalCursor;

        if (hasMore) {
          nextCursor = Buffer.from(JSON.stringify({
            id: events[events.length - 1].id,
            createdAt: events[events.length - 1].createdAt
          })).toString('base64');
        }

        if (originalCursor) {
          prevCursor = Buffer.from(JSON.stringify({
            id: events[0].id,
            createdAt: events[0].createdAt
          })).toString('base64');
        }
      }
      // direction이 prev인 경우
      else {
        hasNext = !!originalCursor;
        hasPrev = hasMore;

        if (originalCursor) {
          nextCursor = Buffer.from(JSON.stringify({
            id: events[events.length - 1].id,
            createdAt: events[events.length - 1].createdAt
          })).toString('base64');
        }

        if (hasMore) {
          prevCursor = Buffer.from(JSON.stringify({
            id: events[0].id,
            createdAt: events[0].createdAt
          })).toString('base64');
        }
      }
    }

    return {
      hasNext,
      hasPrev,
      nextCursor,
      prevCursor
    };
  }
}

export const letterHomeService = new LetterHomeService();