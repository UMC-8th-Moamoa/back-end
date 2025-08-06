/**
 * 참여자 정보 DTO
 */
export class ParticipantDTO {
  constructor(participant) {
    this.id = participant.id;
    this.name = participant.name;
    this.photo = participant.photo;
    this.participatedAt = participant.participatedAt;
  }
}

/**
 * 내 생일 이벤트 응답 DTO
 */
export class MyBirthdayResponseDTO {
  constructor(eventData) {
    this.eventId = eventData.eventId;
    this.totalAmount = eventData.totalAmount;
    this.participantCount = eventData.participantCount;
    this.participants = eventData.participants.map(participant => new ParticipantDTO(participant));
    this.deadline = eventData.deadline;
    this.daysRemaining = eventData.daysRemaining;
    this.birthdayDate = eventData.birthdayDate;
    this.status = eventData.status;
  }

  /**
   * API 응답용 데이터 변환
   * @returns {Object} 정리된 응답 데이터
   */
  toResponse() {
    return {
      eventId: this.eventId,
      totalAmount: this.totalAmount,
      participantCount: this.participantCount,
      participants: this.participants,
      deadline: this.deadline,
      daysRemaining: this.daysRemaining,
      birthdayDate: this.birthdayDate,
      status: this.status
    };
  }

  /**
   * 데이터 유효성 검사
   * @returns {boolean} 유효성 여부
   */
  validate() {
    // 필수 필드 검증
    const requiredFields = ['eventId', 'totalAmount', 'participantCount', 'deadline', 'birthdayDate', 'status'];
    
    for (const field of requiredFields) {
      if (this[field] === undefined || this[field] === null) {
        throw new Error(`필수 필드가 누락되었습니다: ${field}`);
      }
    }

    // 타입 검증
    if (typeof this.eventId !== 'number') {
      throw new Error('eventId는 숫자여야 합니다');
    }

    if (typeof this.totalAmount !== 'number' || this.totalAmount < 0) {
      throw new Error('totalAmount는 0 이상의 숫자여야 합니다');
    }

    if (typeof this.participantCount !== 'number' || this.participantCount < 0) {
      throw new Error('participantCount는 0 이상의 숫자여야 합니다');
    }

    if (!Array.isArray(this.participants)) {
      throw new Error('participants는 배열이어야 합니다');
    }

    // 상태 값 검증
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (!validStatuses.includes(this.status)) {
      throw new Error('status는 유효한 상태값이어야 합니다');
    }

    return true;
  }
}