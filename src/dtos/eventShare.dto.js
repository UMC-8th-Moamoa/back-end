/**
 * 이벤트 공유 요청 DTO
 */
export class EventShareRequestDTO {
  constructor(params, body) {
    this.eventId = params.eventId ? parseInt(params.eventId, 10) : null;
    this.contentType = body.contentType;
    this.expiresAt = body.expiresAt;
  }

  /**
   * 요청 데이터 유효성 검사
   */
  validate() {
    if (!this.eventId || this.eventId < 1) {
      throw new Error('유효한 이벤트 ID가 필요합니다.');
    }

    if (!this.contentType || this.contentType !== 'URL') {
      throw new Error('유효한 콘텐츠 타입이 필요합니다.');
    }

    if (!this.expiresAt) {
      throw new Error('만료 시간이 필요합니다.');
    }

    // 만료 시간이 현재 시간보다 미래인지 확인
    const expiresDate = new Date(this.expiresAt);
    const now = new Date();
    
    if (expiresDate <= now) {
      throw new Error('만료 시간은 현재 시간보다 미래여야 합니다.');
    }
  }

  /**
   * 검증된 요청 데이터 반환
   */
  getValidatedData() {
    this.validate();
    return {
      eventId: this.eventId,
      contentType: this.contentType,
      expiresAt: this.expiresAt
    };
  }
}

/**
 * 공유 정보 DTO
 */
export class ShareInfoDTO {
  constructor(shareData) {
    this.shareUrl = shareData.shareUrl;
    this.shareText = shareData.shareText;
    this.expiresAt = shareData.expiresAt;
  }
}

/**
 * 이벤트 공유 응답 DTO
 */
export class EventShareResponseDTO {
  constructor(data) {
    this.shareInfo = new ShareInfoDTO(data);
  }

  toResponse() {
    return {
      shareUrl: this.shareInfo.shareUrl,
      shareText: this.shareInfo.shareText,
      expiresAt: this.shareInfo.expiresAt
    };
  }
}