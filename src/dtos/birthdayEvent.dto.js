/**
 * 생일 이벤트 상세 조회 요청 DTO
 */
export class BirthdayEventRequestDTO {
  constructor(params, query) {
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
 * 이벤트 기본 정보 DTO
 */
export class EventInfoDTO {
  constructor(eventData) {
    this.id = eventData.id;
    this.deadline = eventData.deadline;
    this.status = eventData.status;
    this.createdAt = eventData.createdAt;
  }
}

/**
 * 생일자 정보 DTO
 */
export class BirthdayPersonDTO {
  constructor(personData) {
    this.id = personData.id;
    this.name = personData.name;
    this.photo = personData.photo || null;
    this.birthday = personData.birthday;
  }
}

/**
 * 카운트다운 정보 DTO
 */
export class CountdownInfoDTO {
  constructor(countdownData) {
    this.daysRemaining = countdownData.daysRemaining;
    this.formattedDaysRemaining = countdownData.formattedDaysRemaining;
    this.isBirthdayToday = countdownData.isBirthdayToday;
  }
}

/**
 * 참여자 정보 DTO
 */
export class ParticipantDTO {
  constructor(participantData) {
    this.userId = participantData.userId;
    this.userName = participantData.userName;
    this.userPhoto = participantData.userPhoto || null;
    this.participatedAt = participantData.participatedAt;
  }
}

/**
 * 참여자 목록 DTO
 */
export class ParticipantsDTO {
  constructor(participantsData, currentUserId) {
    this.totalCount = participantsData.totalCount;
    this.currentUserParticipated = participantsData.list.some(
      participant => participant.userId === currentUserId
    );
    this.list = participantsData.list.map(participant => 
      new ParticipantDTO(participant)
    );
  }
}

/**
 * 위시리스트 아이템 DTO (API 명세서 형식에 맞춤)
 */
export class WishlistItemDTO {
  constructor(itemData) {
    this.id = itemData.id;
    this.name = itemData.name;
    this.price = itemData.price;
    this.image = itemData.image || null;
    this.isPublic = itemData.isPublic;
  }
}

/**
 * 위시리스트 DTO (스와이프용 - 모든 아이템)
 */
export class WishlistDTO {
  constructor(wishlistData) {
    this.totalCount = wishlistData.totalCount;
    this.items = wishlistData.items.map(item => new WishlistItemDTO(item));
  }
}

/**
 * 버튼 상태 정보 DTO
 */
export class ButtonInfoDTO {
  constructor(buttonData) {
    this.type = buttonData.type; // 'PARTICIPATE', 'PARTICIPATED', 'VIEW_RESULT', 'OWNER_WAITING'
    this.text = buttonData.text; // 버튼에 표시될 텍스트
    this.description = buttonData.description; // 버튼 설명
    this.actionUrl = buttonData.actionUrl; // 버튼 클릭 시 호출할 API URL
    this.disabled = buttonData.disabled; // 버튼 비활성화 여부
  }
}

/**
 * 생일 이벤트 상세 조회 응답 DTO
 */
export class BirthdayEventResponseDTO {
  constructor(data) {
    this.event = new EventInfoDTO(data.event);
    this.birthdayPerson = new BirthdayPersonDTO(data.birthdayPerson);
    this.countdown = new CountdownInfoDTO(data.countdown);
    this.participants = new ParticipantsDTO(data.participants, data.currentUserId);
    this.buttonInfo = new ButtonInfoDTO(data.buttonInfo); // 버튼 정보 추가
    
    // 위시리스트가 있는 경우에만 포함
    if (data.wishlist) {
      this.wishlist = new WishlistDTO(data.wishlist);
    }
  }

  toResponse() {
    const response = {
      event: this.event,
      birthdayPerson: this.birthdayPerson,
      countdown: this.countdown,
      participants: this.participants,
      buttonInfo: this.buttonInfo // 버튼 정보 추가
    };

    // 위시리스트가 있는 경우에만 응답에 포함
    if (this.wishlist) {
      response.wishlist = this.wishlist;
    }

    return response;
  }
}