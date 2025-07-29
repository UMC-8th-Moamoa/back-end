/**
 * 다가오는 생일 조회 요청 DTO (스와이프 형식으로 3개씩)
 */
export class UpcomingBirthdayRequestDTO {
  constructor(query) {
    this.days = 7; // 항상 7일로 고정
    this.limit = query.limit ? parseInt(query.limit) : 3; // 기본 3개씩
    this.cursor = query.cursor || null;
    this.direction = query.direction || 'next';
  }

  /**
   * 요청 데이터 유효성 검사
   */
  validate() {
    // limit 검증 (1-10 사이)
    if (isNaN(this.limit) || this.limit < 1 || this.limit > 10) {
      throw new Error('limit은 1-10 사이의 숫자여야 합니다.');
    }

    // direction 검증
    if (!['next', 'prev'].includes(this.direction)) {
      throw new Error('direction은 next 또는 prev여야 합니다.');
    }

    // cursor 검증 (있는 경우에만)
    if (this.cursor) {
      try {
        const decodedCursor = JSON.parse(Buffer.from(this.cursor, 'base64').toString());
        if (!decodedCursor.id || decodedCursor.dDay === undefined) {
          throw new Error('Invalid cursor format');
        }
      } catch (error) {
        throw new Error('유효하지 않은 커서입니다.');
      }
    }
  }

  /**
   * 검증된 요청 데이터 반환
   */
  getValidatedData() {
    this.validate();
    return {
      days: this.days,
      limit: this.limit,
      cursor: this.cursor,
      direction: this.direction
    };
  }
}

/**
 * 친구 정보 DTO
 */
export class FriendInfoDTO {
  constructor(friendData) {
    this.id = friendData.id;
    this.name = friendData.name;
    this.photo = friendData.photo || null;
  }
}

/**
 * 생일 정보 DTO
 */
export class BirthdayInfoDTO {
  constructor(birthdayData) {
    this.date = birthdayData.date;
    this.displayDate = birthdayData.displayDate;
    this.dDay = birthdayData.dDay;
  }
}

/**
 * 다가오는 생일 항목 DTO
 */
export class UpcomingBirthdayItemDTO {
  constructor(item) {
    this.friend = new FriendInfoDTO(item.friend);
    this.birthday = new BirthdayInfoDTO(item.birthday);
    this.eventId = item.eventId;
  }
}

/**
 * 스와이프용 페이지네이션 정보 DTO
 */
export class PaginationDTO {
  constructor(paginationData) {
    this.hasNext = paginationData.hasNext;
    this.hasPrev = paginationData.hasPrev;
    this.nextCursor = paginationData.nextCursor;
    this.prevCursor = paginationData.prevCursor;
    this.totalCount = paginationData.totalCount; // 현재 페이지의 아이템 수
  }
}

/**
 * 다가오는 생일 조회 응답 DTO
 */
export class UpcomingBirthdayResponseDTO {
  constructor(data) {
    this.upcomingBirthdays = data.upcomingBirthdays.map(item => 
      new UpcomingBirthdayItemDTO(item)
    );
    this.pagination = new PaginationDTO(data.pagination);
  }

  toResponse() {
    return {
      upcomingBirthdays: this.upcomingBirthdays,
      pagination: this.pagination
    };
  }
}