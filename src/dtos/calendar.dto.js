export class CalendarRequestDTO {
  constructor(query) {
    const currentDate = new Date();
    this.year = query.year ? parseInt(query.year) : currentDate.getFullYear();
    this.month = query.month ? parseInt(query.month) : currentDate.getMonth() + 1;
  }


// 요청 데이터 유효성 검사

  validate() {
    const currentYear = new Date().getFullYear();
    
    // 연도 검증
    if (isNaN(this.year) || this.year < currentYear - 10 || this.year > currentYear + 10) {
      throw new Error('조회 가능한 연도 범위를 벗어났습니다 (현재 연도 ±10년)');
    }

    // 월 검증
    if (isNaN(this.month) || this.month < 1 || this.month > 12) {
      throw new Error('월은 1부터 12 사이의 값이어야 합니다');
    }
  }


// 검증된 데이터 반환

  getValidatedData() {
    this.validate();
    return {
      year: this.year,
      month: this.month
    };
  }
}

/**
 * 달력 날짜 상세 조회 요청 DTO
 * GET /api/calendar/birthdays/{date}
 */
export class CalendarDateRequestDTO {
  constructor(params) {
    this.date = params.date;
  }


// 날짜 형식 및 유효성 검사

  validate() {
    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!this.date || !dateRegex.test(this.date)) {
      throw new Error('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD 형식 필요)');
    }

    // 유효한 날짜인지 확인
    const parsedDate = new Date(this.date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('유효하지 않은 날짜입니다');
    }

    // 입력된 날짜가 파싱된 날짜와 일치하는지 확인 (예: 2025-02-30 방지)
    const [year, month, day] = this.date.split('-').map(Number);
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() + 1 !== month ||
      parsedDate.getDate() !== day
    ) {
      throw new Error('존재하지 않는 날짜입니다');
    }
  }


// 검증된 데이터 반환

  getValidatedData() {
    this.validate();
    const targetDate = new Date(this.date);
    return {
      date: this.date,
      month: targetDate.getMonth() + 1,
      day: targetDate.getDate()
    };
  }
}


// 친구 정보 DTO

export class FriendDTO {
  constructor(friend) {
    this.id = friend.id;
    this.name = friend.name;
    this.photo = friend.photo || null;
    this.hasActiveEvent = friend.hasActiveEvent || false;
  }
}


// 날짜별 생일 정보 DTO

export class BirthdayDateDTO {
  constructor(birthdayData) {
    this.date = birthdayData.date;
    this.friends = birthdayData.friends.map(friend => new FriendDTO(friend));
    this.eventCount = birthdayData.eventCount || 0;
  }
}


// 달력 조회 응답 DTO

export class CalendarResponseDTO {
  constructor(calendarData) {
    this.year = calendarData.year;
    this.month = calendarData.month;
    this.birthdays = calendarData.birthdays.map(birthday => new BirthdayDateDTO(birthday));
  }


// 정리된 응답 데이터 반환

  toResponse() {
    return {
      calendar: {
        year: this.year,
        month: this.month,
        birthdays: this.birthdays
      }
    };
  }
}


// 날짜 상세 조회용 친구 정보 DTO

export class DateDetailFriendDTO {
  constructor(friend) {
    this.id = friend.id;
    this.name = friend.name;
  }
}


// 날짜 상세 조회용 생일 아이템 DTO

export class DateDetailBirthdayItemDTO {
  constructor(user) {
    this.friend = new DateDetailFriendDTO(user);
  }
}


// 달력 날짜 상세 조회 응답 DTO

export class CalendarDateResponseDTO {
  constructor(date, birthdayUsers) {
    this.date = date;
    this.birthdays = birthdayUsers.map(user => new DateDetailBirthdayItemDTO(user));
  }


// 정리된 응답 데이터 반환

  toResponse() {
    return {
      date: this.date,
      birthdays: this.birthdays
    };
  }
}
