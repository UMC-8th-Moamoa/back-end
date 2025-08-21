import { purchaseProofRepository } from '../repositories/purchaseProof.repository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../middlewares/errorHandler.js';
import { getCurrentKSTISOString, toKSTISOString } from '../utils/datetime.util.js';

class PurchaseProofService {
  // 선물 구매 인증 등록 및 감사 메시지 발송
  async createPurchaseProof(userId, eventId, proofData) {
    // 선물 인증 등록 토스트 알림 (DB 저장 X)
    const { notificationService } = await import('./notification.service.js');
    notificationService.sendToastOnlyNotification(userId, '선물 인증을 등록했습니다', 'success', '선물 인증');
    const { proofImages, message } = proofData;

    // 입력값 검증
    this.validateProofData(proofImages, message);

    // 이벤트 존재 및 권한 확인
    const event = await purchaseProofRepository.getBirthdayEventById(eventId);
    
    if (!event) {
      throw new NotFoundError('존재하지 않는 이벤트입니다');
    }

    // 생일 주인공만 구매 인증을 등록할 수 있음
    if (event.birthdayPersonId !== userId) {
      throw new ForbiddenError('생일 주인공만 구매 인증을 등록할 수 있습니다');
    }

    // 이벤트 상태 확인 (완료된 상태여야 함)
    if (event.status !== 'completed') {
      throw new ValidationError('완료된 이벤트에만 구매 인증을 등록할 수 있습니다');
    }

    // 이미 구매 인증이 등록되었는지 확인
    const existingProof = await purchaseProofRepository.getPurchaseProofByEventId(eventId);
    if (existingProof) {
      throw new ValidationError('이미 구매 인증이 등록된 이벤트입니다');
    }

    // 이벤트 참여자 목록 조회
    const participants = await purchaseProofRepository.getEventParticipants(eventId);
    
    if (participants.length === 0) {
      throw new ValidationError('참여자가 없는 이벤트입니다');
    }

    // 구매 인증 등록 (감사 메시지도 함께 저장됨)
    const purchaseProof = await purchaseProofRepository.createPurchaseProof({
      eventId,
      proofImages,
      message
    });

    // 참여자 전체 알림 (PURCHASE_PROOF)
    const notificationParticipants = participants.map(p => ({ userId: p.userId }));
    if (notificationParticipants.length > 0) {
      const birthdayPersonName = event.birthdayPerson.name;
      const { notificationService } = await import('./notification.service.js');
      await notificationService.createPurchaseProofToParticipants(notificationParticipants, birthdayPersonName);
    }

    // 참여자 정보 반환
    const recipients = participants
      .filter(p => p.userId !== userId) // 자기 자신 제외
      .map(p => ({
        id: p.userId,
        name: p.userName,
        messageId: null
      }));

    return {
      purchaseProof: {
        id: purchaseProof.id,
        eventId: purchaseProof.eventId,
        proofImages: purchaseProof.proofImages
      },
      thankYouMessage: {
        totalSent: recipients.length,
        message: message,
        sentAt: getCurrentKSTISOString(),
        recipients: recipients
      }
    };
  }

  // 구매 인증 조회 (이벤트 참여자 및 생일 주인공만)
  async getPurchaseProof(userId, eventId) {
    // 이벤트 존재 확인
    const event = await purchaseProofRepository.getBirthdayEventById(eventId);
    
    if (!event) {
      throw new NotFoundError('존재하지 않는 이벤트입니다');
    }

    // 권한 확인: 생일 주인공이거나 이벤트 참여자여야 함
    const isAuthorized = await this.checkPurchaseProofViewPermission(userId, eventId, event.birthdayPersonId);
    
    if (!isAuthorized) {
      throw new ForbiddenError('구매 인증을 조회할 권한이 없습니다 (이벤트 참여자 또는 생일 주인공만 가능)');
    }

    // 구매 인증 조회
    const purchaseProofDetail = await purchaseProofRepository.getPurchaseProofDetailByEventId(eventId);
    
    if (!purchaseProofDetail) {
      throw new NotFoundError('구매 인증이 등록되지 않았습니다');
    }

    // 감사 메시지를 받은 사용자들 조회 (구매 인증이 있으면 모든 참여자가 받은 것)
    const thankYouRecipients = await purchaseProofRepository.getThankYouMessageRecipients(eventId);

    return {
      event: {
        id: purchaseProofDetail.event.id,
        birthdayPerson: purchaseProofDetail.event.birthdayPerson
      },
      purchaseProof: {
        proofImages: purchaseProofDetail.proofImages
      },
      thankYouMessage: {
        totalSent: thankYouRecipients.length,
        message: purchaseProofDetail.message,
        sentAt: toKSTISOString(purchaseProofDetail.createdAt),
        recipients: thankYouRecipients.map(recipient => ({
          id: recipient.recipient.id,
          name: recipient.recipient.name,
          photo: recipient.recipient.photo
        }))
      }
    };
  }

  // 구매 인증 조회 권한 확인
  async checkPurchaseProofViewPermission(userId, eventId, birthdayPersonId) {
    // 생일 주인공인 경우
    if (userId === birthdayPersonId) {
      return true;
    }

    // 이벤트 참여자인지 확인
    const participants = await purchaseProofRepository.getEventParticipants(eventId);
    const isParticipant = participants.some(participant => participant.userId === userId);
    
    return isParticipant;
  }

  // 구매 인증 데이터 검증
  validateProofData(proofImages, message) {
    // 구매 인증 이미지 검증
    if (!proofImages || !Array.isArray(proofImages) || proofImages.length === 0) {
      throw new ValidationError('구매 인증 이미지가 필요합니다');
    }

    if (proofImages.length > 5) {
      throw new ValidationError('구매 인증 이미지는 최대 5개까지 업로드할 수 있습니다');
    }

    // URL 형식 검증
    const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
    for (const imageUrl of proofImages) {
      if (typeof imageUrl !== 'string' || !urlRegex.test(imageUrl)) {
        throw new ValidationError('올바른 이미지 URL 형식이 아닙니다');
      }
    }

    // 감사 메시지 검증
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new ValidationError('감사 메시지가 필요합니다');
    }

    if (message.length > 500) {
      throw new ValidationError('감사 메시지는 500자를 초과할 수 없습니다');
    }
  }
}

export const purchaseProofService = new PurchaseProofService();