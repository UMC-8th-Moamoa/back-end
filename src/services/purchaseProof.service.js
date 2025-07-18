import PurchaseProofRepository from '../repositories/purchaseProof.repository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../middlewares/errorHandler.js';

/**
 * 구매 인증 관련 비즈니스 로직
 */
class PurchaseProofService {
  /**
   * 선물 구매 인증 등록 및 감사 메시지 발송
   * @param {number} userId - 요청한 사용자 ID
   * @param {number} eventId - 이벤트 ID
   * @param {Object} proofData - 인증 데이터
   * @param {Array} proofData.proofImages - 구매 인증 이미지 URL 배열
   * @param {string} proofData.message - 감사 메시지
   * @returns {Object} 구매 인증 및 감사 메시지 결과
   */
  static async createPurchaseProof(userId, eventId, proofData) {
    const { proofImages, message } = proofData;

    // 입력값 검증
    this.validateProofData(proofImages, message);

    // 이벤트 존재 및 권한 확인
    const event = await PurchaseProofRepository.getBirthdayEventById(eventId);
    
    if (!event) {
      throw new NotFoundError('존재하지 않는 이벤트입니다');
    }

    // 생일 주인공만 구매 인증을 등록할 수 있음
    if (event.birthdayPersonId !== userId) {
      throw new ForbiddenError('생일 주인공만 구매 인증을 등록할 수 있습니다');
    }

    // 이벤트 상태 확인 (활성 상태여야 함)
    if (event.status !== 'active') {
      throw new ValidationError('활성 상태가 아닌 이벤트입니다');
    }

    // 이미 구매 인증이 등록되었는지 확인
    const existingProof = await PurchaseProofRepository.getPurchaseProofByEventId(eventId);
    if (existingProof) {
      throw new ValidationError('이미 구매 인증이 등록된 이벤트입니다');
    }

    // 이벤트 참여자 목록 조회
    const participants = await PurchaseProofRepository.getEventParticipants(eventId);
    
    if (participants.length === 0) {
      throw new ValidationError('참여자가 없는 이벤트입니다');
    }

    // 구매 인증 등록
    const purchaseProof = await PurchaseProofRepository.createPurchaseProof({
      eventId,
      birthdayPersonId: userId,
      proofImages,
      createdAt: new Date()
    });

    // 모든 참여자에게 감사 메시지 발송
    const thankYouMessages = await this.sendThankYouMessages(
      eventId,
      userId,
      participants,
      message
    );

    return {
      purchaseProof: {
        id: purchaseProof.id,
        eventId: purchaseProof.eventId,
        proofImages: purchaseProof.proofImages
      },
      thankYouMessage: {
        totalSent: thankYouMessages.length,
        message: message,
        sentAt: new Date().toISOString(),
        recipients: thankYouMessages.map(msg => ({
          id: msg.receiverId,
          name: msg.receiverName,
          messageId: msg.id
        }))
      }
    };
  }

  /**
   * 모든 참여자에게 감사 메시지 발송
   * @param {number} eventId - 이벤트 ID
   * @param {number} senderId - 발신자 ID (생일 주인공)
   * @param {Array} participants - 참여자 목록
   * @param {string} message - 감사 메시지
   * @returns {Array} 발송된 메시지 목록
   */
  static async sendThankYouMessages(eventId, senderId, participants, message) {
    const messages = [];

    for (const participant of participants) {
      // 자기 자신에게는 메시지를 보내지 않음
      if (participant.userId === senderId) {
        continue;
      }

      const letter = await PurchaseProofRepository.createLetter({
        birthdayEventId: eventId,
        senderId: senderId,
        receiverId: participant.userId,
        title: '구매 완료 감사 메시지',
        content: message,
        sentAt: new Date()
      });

      messages.push({
        id: letter.id,
        receiverId: participant.userId,
        receiverName: participant.userName
      });
    }

    return messages;
  }

  /**
   * 구매 인증 데이터 검증
   * @param {Array} proofImages - 구매 인증 이미지 배열
   * @param {string} message - 감사 메시지
   */
  static validateProofData(proofImages, message) {
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

export default PurchaseProofService;