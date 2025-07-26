/**
 * 편지 홈 화면 요청 DTO
 * GET /api/home/letters?limit=3&cursor={cursor}&direction=next
 */
export class LetterHomeRequestDTO {
  constructor(query) {
    this.limit = query.limit ? parseInt(query.limit) : 3;
    this.cursor = query.cursor || null;
    this.direction = query.direction || 'next';
  }

// 요청 데이터 유효성 검사
  validate() {
    // limit 검증
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
        if (!decodedCursor.id || !decodedCursor.createdAt) {
          throw new Error('Invalid cursor format');
        }
      } catch (error) {
        throw new Error('유효하지 않은 커서입니다.');
      }
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
    this.birthdayEventId = letter.birthdayEventId;
    this.birthdayPersonName = letter.birthdayPersonName;
    this.birthdayPersonPhoto = letter.birthdayPersonPhoto;
    this.birthday = letter.birthday;
    this.hasLetter = letter.hasLetter;
    this.letterId = letter.letterId;
    this.lastModified = letter.lastModified;
    this.daysLeft = letter.daysLeft;
  }
}

// 페이지네이션 정보 DTO
export class PaginationDTO {
  constructor(pagination) {
    this.hasNext = pagination.hasNext;
    this.hasPrev = pagination.hasPrev;
    this.nextCursor = pagination.nextCursor;
    this.prevCursor = pagination.prevCursor;
  }
}

// 편지 홈 화면 응답 DTO
export class LetterHomeResponseDTO {
  constructor(data) {
    this.letters = data.letters.map(letter => new LetterItemDTO(letter));
    this.pagination = new PaginationDTO(data.pagination);
  }

// 정리된 응답 데이터 반환
  toResponse() {
    return {
      letters: this.letters,
      pagination: this.pagination
    };
  }
}