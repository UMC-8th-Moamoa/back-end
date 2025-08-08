import prisma from '../config/prismaClient.js';

class PurchaseProofRepository {
  // 생일 이벤트 정보 조회
  async getBirthdayEventById(eventId) {
    return await prisma.birthdayEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        birthdayPersonId: true,
        title: true,
        status: true,
        deadline: true,
        currentAmount: true,
        birthdayPerson: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        }
      }
    });
  }

  // 이벤트 참여자 목록 조회
  async getEventParticipants(eventId) {
    const participants = await prisma.birthdayEventParticipant.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true
          }
        }
      }
    });

    return participants.map(participant => ({
      id: participant.id,
      userId: participant.user.id,
      userName: participant.user.name,
      userEmail: participant.user.email,
      userPhoto: participant.user.photo,
      amount: participant.amount,
      message: participant.message,
      createdAt: participant.createdAt
    }));
  }

  // 구매 인증 조회 (이벤트별)
  async getPurchaseProofByEventId(eventId) {
    return await prisma.purchaseProof.findFirst({
      where: {
        birthdayEventId: eventId
      }
    });
  }

  // 구매 인증 상세 정보 조회 (이벤트별)
  async getPurchaseProofDetailByEventId(eventId) {
    const purchaseProof = await prisma.purchaseProof.findFirst({
      where: {
        birthdayEventId: eventId
      },
      include: {
        birthdayEvent: {
          include: {
            birthdayPerson: {
              select: {
                id: true,
                name: true,
                photo: true
              }
            }
          }
        }
      }
    });

    if (!purchaseProof) {
      return null;
    }
    
    return {
      id: purchaseProof.id,
      eventId: purchaseProof.birthdayEventId,
      proofImages: purchaseProof.proofImages, // JSON 배열
      message: purchaseProof.message,
      createdAt: purchaseProof.createdAt,
      event: {
        id: purchaseProof.birthdayEvent.id,
        birthdayPerson: purchaseProof.birthdayEvent.birthdayPerson
      }
    };
  }

  // 감사 메시지를 받은 사용자들 조회
  async getThankYouMessageRecipients(eventId) {
    // 구매 인증이 있으면 해당 이벤트의 참여자들이 감사 메시지를 받은 것
    const purchaseProof = await prisma.purchaseProof.findFirst({
      where: {
        birthdayEventId: eventId
      }
    });

    if (!purchaseProof) {
      return [];
    }

    // 이벤트 참여자들이 곧 감사 메시지를 받은 사람들
    const participants = await this.getEventParticipants(eventId);
    
    return participants.map(participant => ({
      id: participant.id,
      sentAt: purchaseProof.createdAt,
      recipient: {
        id: participant.userId,
        name: participant.userName,
        photo: participant.userPhoto
      }
    }));
  }

  // 구매 인증 등록
  async createPurchaseProof(proofData) {
    const { eventId, proofImages, message } = proofData;

    const purchaseProof = await prisma.purchaseProof.create({
      data: {
        birthdayEventId: eventId,
        proofImages: proofImages, // JSON 배열로 저장
        message: message
      }
    });
    
    return {
      id: purchaseProof.id,
      eventId: purchaseProof.birthdayEventId,
      proofImages: purchaseProof.proofImages,
      message: purchaseProof.message,
      createdAt: purchaseProof.createdAt
    };
  }

  // 사용자 정보 조회
  async getUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
  }

  // 구매 인증 삭제 (필요시)
  async deletePurchaseProof(proofId) {
    return await prisma.purchaseProof.delete({
      where: { id: proofId }
    });
  }
}

export const purchaseProofRepository = new PurchaseProofRepository();