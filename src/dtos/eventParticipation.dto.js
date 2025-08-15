/**
 * 이벤트 참여 화면 정보 조회 요청 DTO
 */
export class EventParticipationInfoRequestDTO {
  constructor(params) {
    this.eventId = params.eventId ? parseInt(params.eventId, 10) : null;
  }

  /**
   * 요청 데이터 유효성 검사
   */
  validate() {
    if (!this.eventId || this.eventId < 1) {
      throw new Error('유효한 이벤트 ID가 필요합니다.');
    }
  }

  /**
   * 검증된 요청 데이터 반환
   */
  getValidatedData() {
    this.validate();
    return {
      eventId: this.eventId
    };
  }
}

/**
 * 이벤트 참여 요청 DTO
 */
export class EventParticipationRequestDTO {
  constructor(params, body) {
    this.eventId = params.eventId ? parseInt(params.eventId, 10) : null;
    this.participationType = body.participationType;
    this.amount = body.amount !== undefined ? parseInt(body.amount, 10) : null;
  }

  /**
   * 요청 데이터 유효성 검사
   */
  validate() {
    if (!this.eventId || this.eventId < 1) {
      throw new Error('유효한 이벤트 ID가 필요합니다.');
    }

    if (!this.participationType || !['WITH_MONEY', 'WITHOUT_MONEY'].includes(this.participationType)) {
      throw new Error('유효한 참여 타입이 필요합니다.');
    }

    if (this.participationType === 'WITH_MONEY') {
      if (this.amount === null || this.amount === undefined) {
        throw new Error('금액을 입력해 주세요');
      }
      if (this.amount < 1) {
        throw new Error('참여 금액은 1원 이상이어야 합니다');
      }
    }

    if (this.participationType === 'WITHOUT_MONEY') {
      if (this.amount !== 0) {
        throw new Error('송금 없이 참여하기는 금액이 0이어야 합니다');
      }
    }
  }

  /**
   * 검증된 요청 데이터 반환
   */
  getValidatedData() {
    this.validate();
    return {
      eventId: this.eventId,
      participationType: this.participationType,
      amount: this.amount
    };
  }
}

/**
 * 이벤트 정보 DTO
 */
export class EventInfoDTO {
  constructor(eventData) {
    this.id = eventData.id;
    this.birthdayPersonName = eventData.birthdayPersonName;
    this.deadline = eventData.deadline;
    this.status = eventData.status;
  }
}

/**
 * 카운트다운 정보 DTO
 */
export class CountdownInfoDTO {
  constructor(countdownData) {
    this.timeRemaining = countdownData.timeRemaining;
    this.deadlineFormatted = countdownData.deadlineFormatted;
  }
}

/**
 * 참여 정보 DTO
 */
export class ParticipationInfoDTO {
  constructor(participationData) {
    this.currentUserParticipated = participationData.currentUserParticipated;
    this.participationCount = participationData.participationCount;
    this.hasWrittenLetter = participationData.hasWrittenLetter;
  }
}

/**
 * 참여 응답 DTO
 */
export class ParticipationDTO {
  constructor(participationData) {
    this.id = participationData.id;
    this.eventId = participationData.eventId;
    this.userId = participationData.userId;
    this.amount = participationData.amount;
    this.participationType = participationData.participationType;
    this.participatedAt = participationData.participatedAt;
  }
}

/**
 * 이벤트 현황 DTO
 */
export class EventStatusDTO {
  constructor(eventStatusData) {
    this.currentAmount = eventStatusData.currentAmount;
    this.participantCount = eventStatusData.participantCount;
  }
}

/**
 * 버튼 상태 정보 DTO
 */
export class ButtonStatusDTO {
  constructor(buttonStatusData) {
    this.type = buttonStatusData.type;
    this.message = buttonStatusData.message;
    this.buttonText = buttonStatusData.buttonText;
    this.buttonAction = buttonStatusData.buttonAction;
    this.isEnabled = buttonStatusData.isEnabled;
  }
}

/**
 * 이벤트 참여 화면 정보 조회 응답 DTO
 */
export class EventParticipationInfoResponseDTO {
  constructor(data) {
    this.event = new EventInfoDTO(data.event);
    this.countdown = new CountdownInfoDTO(data.countdown);
    this.participation = new ParticipationInfoDTO(data.participation);
    this.buttonStatus = new ButtonStatusDTO(data.buttonStatus);
  }

  toResponse() {
    return {
      event: this.event,
      countdown: this.countdown,
      participation: this.participation,
      buttonStatus: this.buttonStatus
    };
  }
}

/**
 * 이벤트 참여 응답 DTO
 */
export class EventParticipationResponseDTO {
  constructor(data) {
    this.participation = new ParticipationDTO(data.participation);
    this.event = new EventStatusDTO(data.event);
  }

  toResponse() {
    return {
      participation: this.participation,
      event: this.event
    };
  }
}