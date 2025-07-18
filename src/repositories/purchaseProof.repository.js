import prisma from '../config/prismaClient.js';

/**
 * 구매 인증 관련 데이터베이스 접근 계층
 */
class PurchaseProofRepository {
  /**
   * 생일 이벤트 정보 조회
   * @param {number} eventId - 이벤트 ID
   * @returns {Object|null} 이벤트 정보
   */
  static async getBirthdayEventById(eventId) {
    return await prisma.birthdayEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        birthdayPersonId: true,
        creatorId: true,
        title: true,
        status: true,
        deadline: true,
        targetAmount: true,
        currentAmount: true
      }
    });
  }

  /**
   * 이벤트 참여자 목록 조회
   * @param {number} eventId - 이벤트 ID
   * @returns {Array} 참여자 목록
   */
  static async getEventParticipants(eventId) {
    const participants = await prisma.birthdayEventParticipant.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return participants.map(participant => ({
      id: participant.id,
      userId: participant.user.id,
      userName: participant.user.name,
      userEmail: participant.user.email,
      amount: participant.amount,
      message: participant.message,
      createdAt: participant.createdAt
    }));
  }

  /**
   * 구매 인증 조회 (이벤트별)
   * @param {number} eventId - 이벤트 ID
   * @returns {Object|null} 구매 인증 정보
   */
  static async getPurchaseProofByEventId(eventId) {
    // 구매 인증은 Letter 테이블을 활용하여 저장
    // 구매 인증 전용 테이블이 없으므로 Letter 테이블의 특별한 형태로 저장
    return await prisma.letter.findFirst({
      where: {
        birthdayEventId: eventId,
        title: 'PURCHASE_PROOF' // 구매 인증임을 나타내는 특별한 제목
      }
    });
  }

  /**
   * 구매 인증 등록
   * @param {Object} proofData - 구매 인증 데이터
   * @param {number} proofData.eventId - 이벤트 ID
   * @param {number} proofData.birthdayPersonId - 생일 주인공 ID
   * @param {Array} proofData.proofImages - 구매 인증 이미지 URL 배열
   * @param {Date} proofData.createdAt - 생성 시간
   * @returns {Object} 생성된 구매 인증 정보
   */
  static async createPurchaseProof(proofData) {
    const { eventId, birthdayPersonId, proofImages, createdAt } = proofData;

    // Letter 테이블을 활용하여 구매 인증 저장
    // content 필드에 JSON 형태로 구매 인증 데이터 저장
    const purchaseProof = await prisma.letter.create({
      data: {
        birthdayEventId: eventId,
        senderId: birthdayPersonId,
        receiverId: birthdayPersonId, // 자기 자신을 수신자로 설정
        title: 'PURCHASE_PROOF',
        content: JSON.stringify({
          type: 'purchase_proof',
          proofImages: proofImages,
          createdAt: createdAt.toISOString()
        }),
        sentAt: createdAt
      }
    });

    // 응답 형태로 변환
    const contentData = JSON.parse(purchaseProof.content);
    
    return {
      id: purchaseProof.id,
      eventId: purchaseProof.birthdayEventId,
      proofImages: contentData.proofImages,
      createdAt: contentData.createdAt
    };
  }

  /**
   * 감사 편지 발송
   * @param {Object} letterData - 편지 데이터
   * @param {number} letterData.birthdayEventId - 생일 이벤트 ID
   * @param {number} letterData.senderId - 발신자 ID
   * @param {number} letterData.receiverId - 수신자 ID
   * @param {string} letterData.title - 편지 제목
   * @param {string} letterData.content - 편지 내용
   * @param {Date} letterData.sentAt - 발송 시간
   * @returns {Object} 생성된 편지 정보
   */
  static async createLetter(letterData) {
    return await prisma.letter.create({
      data: letterData,
      select: {
        id: true,
        birthdayEventId: true,
        senderId: true,
        receiverId: true,
        title: true,
        content: true,
        sentAt: true
      }
    });
  }

  /**
   * 사용자 정보 조회
   * @param {number} userId - 사용자 ID
   * @returns {Object|null} 사용자 정보
   */
  static async getUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
  }

  /**
   * 이벤트의 구매 인증 목록 조회
   * @param {number} eventId - 이벤트 ID
   * @returns {Array} 구매 인증 목록
   */
  static async getPurchaseProofsByEventId(eventId) {
    const proofs = await prisma.letter.findMany({
      where: {
        birthdayEventId: eventId,
        title: 'PURCHASE_PROOF'
      },
      orderBy: {
        sentAt: 'desc'
      }
    });

    return proofs.map(proof => {
      const contentData = JSON.parse(proof.content);
      return {
        id: proof.id,
        eventId: proof.birthdayEventId,
        proofImages: contentData.proofImages,
        createdAt: contentData.createdAt
      };
    });
  }
}

export default PurchaseProofRepository;