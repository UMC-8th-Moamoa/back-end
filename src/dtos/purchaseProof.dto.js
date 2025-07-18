/**
 * 구매 인증 등록 요청 DTO
 * POST /api/birthday-events/{eventId}/proof
 */
export class PurchaseProofRequestDTO {
  constructor(params, body) {
    this.eventId = params.eventId ? parseInt(params.eventId) : null;
    this.proofImages = body.proofImages || [];
    this.message = body.message || '';
  }


// 요청 데이터 유효성 검사

  validate() {
    // 이벤트 ID 검증
    if (!this.eventId || isNaN(this.eventId) || this.eventId < 1) {
      throw new Error('유효한 이벤트 ID가 필요합니다');
    }

    // 구매 인증 이미지 검증
    if (!Array.isArray(this.proofImages) || this.proofImages.length === 0) {
      throw new Error('구매 인증 이미지가 필요합니다');
    }

    if (this.proofImages.length > 5) {
      throw new Error('구매 인증 이미지는 최대 5개까지 업로드할 수 있습니다');
    }

    // 이미지 URL 형식 검증
    const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
    for (const imageUrl of this.proofImages) {
      if (typeof imageUrl !== 'string' || !urlRegex.test(imageUrl)) {
        throw new Error('올바른 이미지 URL 형식이 아닙니다 (jpg, jpeg, png, gif, webp 지원)');
      }
    }

    // 감사 메시지 검증
    if (!this.message || typeof this.message !== 'string' || this.message.trim().length === 0) {
      throw new Error('감사 메시지가 필요합니다');
    }

    if (this.message.length > 500) {
      throw new Error('감사 메시지는 500자를 초과할 수 없습니다');
    }
  }


// 검증된 데이터 반환

  getValidatedData() {
    this.validate();
    return {
      eventId: this.eventId,
      proofImages: this.proofImages,
      message: this.message.trim()
    };
  }
}


// 구매 인증 정보 DTO

export class PurchaseProofInfoDTO {
  constructor(purchaseProof) {
    this.id = purchaseProof.id;
    this.eventId = purchaseProof.eventId;
    this.proofImages = [...purchaseProof.proofImages];
  }
}


// 메시지 수신자 정보 DTO

export class MessageRecipientDTO {
  constructor(recipient) {
    this.id = recipient.receiverId || recipient.id;
    this.name = recipient.receiverName || recipient.name;
    this.messageId = recipient.id || recipient.messageId;
  }
}


// 감사 메시지 정보 DTO

export class ThankYouMessageInfoDTO {
  constructor(messageData) {
    this.totalSent = messageData.totalSent || 0;
    this.message = messageData.message || '';
    this.sentAt = messageData.sentAt || new Date().toISOString();
    this.recipients = messageData.recipients ? 
      messageData.recipients.map(recipient => new MessageRecipientDTO(recipient)) : [];
  }
}


// 구매 인증 등록 응답 DTO

export class PurchaseProofResponseDTO {
  constructor(purchaseProof, thankYouMessage) {
    this.purchaseProof = new PurchaseProofInfoDTO(purchaseProof);
    this.thankYouMessage = new ThankYouMessageInfoDTO(thankYouMessage);
  }


// 정리된 응답 데이터 반환

  toResponse() {
    return {
      purchaseProof: this.purchaseProof,
      thankYouMessage: this.thankYouMessage
    };
  }
}


// 구매 인증 목록 조회용 DTO

export class PurchaseProofListItemDTO {
  constructor(proof) {
    this.id = proof.id;
    this.eventId = proof.eventId;
    this.proofImages = proof.proofImages;
    this.createdAt = proof.createdAt;
  }
}


// 구매 인증 목록 응답 DTO

export class PurchaseProofListResponseDTO {
  constructor(proofs, pagination = null) {
    this.proofs = proofs.map(proof => new PurchaseProofListItemDTO(proof));
    this.pagination = pagination;
  }


// 정리된 응답 데이터 반환

  toResponse() {
    const response = {
      proofs: this.proofs
    };

    if (this.pagination) {
      response.pagination = this.pagination;
    }

    return response;
  }
}
