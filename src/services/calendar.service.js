import { calendarRepository } from '../repositories/calendar.repository.js';
import { ValidationError } from '../middlewares/errorHandler.js';
import { formatDateToKST } from '../utils/datetime.util.js';

class CalendarService {
  // 특정 월의 팔로우한 사용자들의 생일 달력 조회
  async getBirthdayCalendar(userId, year, month) {
    // 입력값 검증
    this.validateDateInput(year, month);

    // 해당 월의 첫날과 마지막날 계산
    const startDate = new Date(year, month - 1, 1); // month는 0부터 시작하므로 -1
    const endDate = new Date(year, month, 0); // 다음 달 0일 = 현재 달 마지막일

    // 팔로우한 사용자들의 생일 정보 조회
    const followedUsersBirthdays = await calendarRepository.getFriendsBirthdaysInMonth(
      userId, 
      startDate, 
      endDate
    );

    // 데이터를 날짜별로 그룹화하고 정리
    const birthdaysByDate = this.groupBirthdaysByDate(followedUsersBirthdays, year, month);

    return {
      year,
      month,
      birthdays: birthdaysByDate
    };
  }

  // 특정 날짜의 생일 및 이벤트 상세 정보 조회
  async getBirthdaysByDate(userId, month, day) {
    // 해당 날짜에 생일인 팔로우한 사용자들 조회
    const birthdayUsers = await calendarRepository.getFriendsBirthdaysBySpecificDate(
      userId, 
      month, 
      day
    );

    return birthdayUsers.map(user => ({
      friend: {
        id: user.id,
        name: user.name
      }
    }));
  }

  // 날짜 입력값 검증
  validateDateInput(year, month) {
    const currentYear = new Date().getFullYear();
    
    // 연도 검증 (현재년도 기준 ±10년)
    if (year < currentYear - 10 || year > currentYear + 10) {
      throw new ValidationError('조회 가능한 연도 범위를 벗어났습니다');
    }

    // 월 검증 (1-12)
    if (month < 1 || month > 12) {
      throw new ValidationError('월은 1부터 12 사이의 값이어야 합니다');
    }
  }

  // 날짜 형식 검증 (YYYY-MM-DD)
  validateDateFormat(date) {
    // 날짜 형식 정규식 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!dateRegex.test(date)) {
      throw new ValidationError('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD 형식 필요)');
    }

    // 유효한 날짜인지 확인
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new ValidationError('유효하지 않은 날짜입니다');
    }

    // 입력된 날짜가 파싱된 날짜와 일치하는지 확인 (예: 2025-02-30 방지)
    const [year, month, day] = date.split('-').map(Number);
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() + 1 !== month ||
      parsedDate.getDate() !== day
    ) {
      throw new ValidationError('존재하지 않는 날짜입니다');
    }
  }

  // 생일 데이터를 날짜별로 그룹화
  groupBirthdaysByDate(followedUsersBirthdays, year, month) {
    const birthdayMap = new Map();

    followedUsersBirthdays.forEach(user => {
      // 생일의 월/일만 사용하여 해당 연도의 날짜 생성
      const birthdayThisYear = new Date(year, user.birthday.getMonth(), user.birthday.getDate());
      const dateKey = formatDateToKST(birthdayThisYear);

      if (!birthdayMap.has(dateKey)) {
        birthdayMap.set(dateKey, {
          date: dateKey,
          friends: [],
          eventCount: 0
        });
      }

      const dateData = birthdayMap.get(dateKey);
      
      // 팔로우한 사용자 정보 추가
      dateData.friends.push({
        id: user.id,
        name: user.name,
        photo: user.photo,
        hasActiveEvent: user.hasActiveEvent || false
      });

      // 활성 이벤트가 있으면 카운트 증가
      if (user.hasActiveEvent) {
        dateData.eventCount++;
      }
    });

    // Map을 배열로 변환하고 날짜순으로 정렬
    return Array.from(birthdayMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
}

export const calendarService = new CalendarService();