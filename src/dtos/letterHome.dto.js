/**
 * 편지 홈 화면 요청 DTO
 * GET /api/home/letters?limit=3&cursor={cursor}&direction=next
 */
export class LetterHomeRequestDTO {
  constructor(query) {
    this.limit = query && query.limit ? parseInt(query.limit) : 3;
    this.cursor = query && query.cursor ? query.cursor : null;
    this.direction = query && query.direction ? query.direction : 'next';
  }

// 요청 데이터 유효성 검사
  validate() {
    try {
      // limit 검증
      if (isNaN(this.limit) || this.limit < 1 || this.limit > 10) {
        throw new Error('limit은 1-10 사이의 숫자여야 합니다.');
      }

      // direction 검증 (대소문자 무관)
      const normalizedDirection = this.direction.toLowerCase();
      if (!['next', 'prev'].includes(normalizedDirection)) {
        throw new Error('direction은 next 또는 prev여야 합니다.');
      }
      this.direction = normalizedDirection; // 정규화된 값으로 설정

      // cursor 검증 (있는 경우에만)
      if (this.cursor) {
        try {
          const decodedCursor = JSON.parse(Buffer.from(this.cursor, 'base64').toString());
          if (!decodedCursor || !decodedCursor.id || !decodedCursor.createdAt) {
            throw new Error('Invalid cursor format');
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
        } catch (cursorError) {
          throw new Error('유효하지 않은 커서입니다: ' + cursorError.message);
        }
      }
    } catch (error) {
      console.error('DTO Validation Error:', error);
      throw error;
    }
  }

// 검증된 데이터 반환
  getValidatedData() {
    this.validate();
    return {
      limit: this.limit,
      cursor: this.cursor,
      direction: this.direction
    };
  }
}

// 편지 정보 DTO
export class LetterItemDTO {
  constructor(letter) {
    this.birthdayEventId = letter && letter.birthdayEventId ? letter.birthdayEventId : null;
    this.birthdayPersonName = letter && letter.birthdayPersonName ? letter.birthdayPersonName : '알 수 없음';
    this.birthdayPersonPhoto = letter && letter.birthdayPersonPhoto ? letter.birthdayPersonPhoto : null;
    this.birthday = letter && letter.birthday ? letter.birthday : null;
    this.hasLetter = letter ? !!letter.hasLetter : false;
    this.letterId = letter && letter.letterId ? letter.letterId : null;
    this.lastModified = letter && letter.lastModified ? letter.lastModified : null;
    this.daysLeft = letter && typeof letter.daysLeft === 'number' ? letter.daysLeft : 0;
  }
}

// 페이지네이션 정보 DTO
export class PaginationDTO {
  constructor(pagination) {
    this.hasNext = pagination ? !!pagination.hasNext : false;
    this.hasPrev = pagination ? !!pagination.hasPrev : false;
    this.nextCursor = pagination && pagination.nextCursor ? pagination.nextCursor : null;
    this.prevCursor = pagination && pagination.prevCursor ? pagination.prevCursor : null;
  }
}

// 편지 홈 화면 응답 DTO
export class LetterHomeResponseDTO {
  constructor(data) {
    this.letters = data && data.letters && Array.isArray(data.letters) 
      ? data.letters.map(letter => new LetterItemDTO(letter))
      : [];
    this.pagination = new PaginationDTO(data && data.pagination ? data.pagination : {});
  }

// 정리된 응답 데이터 반환
  toResponse() {
    return {
      letters: this.letters,
      pagination: this.pagination
    };
  }
}