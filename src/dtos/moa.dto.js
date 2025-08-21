export class MoaRequestDTO {
  constructor(query) {
    this.limit = query.limit ? parseInt(query.limit) : 1;
    this.cursor = query.cursor || null;
    this.direction = query.direction || 'next';
  }


// 요청 데이터 유효성 검사
  validate() {
    // limit 검증
    if (isNaN(this.limit) || this.limit < 1 || this.limit > 20) {
      throw new Error('limit은 1에서 20 사이의 값이어야 합니다');
    }

    // direction 검증
    if (!['next', 'prev'].includes(this.direction)) {
      throw new Error('direction은 next 또는 prev여야 합니다');
    }

    // cursor 검증 (있는 경우에만)
    if (this.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(this.cursor, 'base64').toString());
        if (!decoded.id || !decoded.createdAt) {
          throw new Error('커서 형식이 올바르지 않습니다');
        }
      } catch (error) {
        throw new Error('유효하지 않은 커서 형식입니다');
      }
    }
  }

  /**
   * 검증된 데이터 반환
   */
  getValidatedData() {
    this.validate();
    return {
      limit: this.limit,
      cursor: this.cursor,
      direction: this.direction
    };
  }

  /**
   * 커서 디코딩
   */
  getDecodedCursor() {
    if (!this.cursor) return null;
    
    try {
      return JSON.parse(Buffer.from(this.cursor, 'base64').toString());
    } catch (error) {
      return null;
    }
  }
}

/**
 * 모아모아 정보 DTO
 */
export class MoaItemDTO {
  constructor(moa, userId) {
    this.id = moa.id;
    this.birthdayPersonName = moa.birthdayPerson?.name || moa.birthdayPersonName;
    this.birthdayPersonPhoto = moa.birthdayPerson?.photo || moa.birthdayPersonPhoto;
    this.participationStatus = moa.isParticipating ? 'participating' : 'not_participating';
    this.eventStatus = moa.status;

    // 본인 여부
    this.isBirthdayPerson = moa.birthdayPersonId === userId;

    // 배너 타입 분기
    if (this.isBirthdayPerson) {
      // 1순위: 잔금 처리 필요 (예: needBalance === true)
      if (moa.status === 'completed' && moa.needBalance) {
        this.bannerType = 'balance';
      } else if (moa.status === 'completed') {
        // 본인 && 종료
        this.bannerType = 'completed';
        if (moa.needCertification) {
          this.bannerType = 'certification';
        }
      } else {
        // 본인 && 진행 중
        this.bannerType = 'my_in_progress';
      }
    } else if (moa.isParticipating && moa.status === 'active') {
      // 참여자 && 진행 중
      this.bannerType = 'participating';
    } else {
      // 그 외(참여자 && 종료 등): 배너 없음
      this.bannerType = null;
    }
  }
}

/**
 * 페이지네이션 정보 DTO
 */
export class MoaPaginationDTO {
  constructor(options) {
    this.Next = options.hasNext || false;
    this.Prev = options.hasPrev || false;
    this.nextCursor = options.nextCursor || null;
    this.prevCursor = options.prevCursor || null;
  }
}

/**
 * 모아모아 목록 조회 응답 DTO
 */
export class MoaResponseDTO {
  constructor(moas, paginationOptions, userId) {
    this.moas = moas.map(moa => new MoaItemDTO(moa, userId));
    this.pagination = new MoaPaginationDTO(paginationOptions);
  }

  /**
   * 정리된 응답 데이터 반환
   */
  toResponse() {
    return {
      moas: this.moas,
      pagination: this.pagination
    };
  }
}