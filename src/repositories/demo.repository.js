import prisma from '../config/prismaClient.js';

class DemoRepository {
  /**
   * 데모 이벤트 생성
   * @param {Object} demoEventData - 데모 이벤트 데이터
   * @returns {Promise<Object>} 생성된 데모 이벤트
   */
  async createDemoEvent(demoEventData) {
    return await prisma.demoEvent.create({
      data: demoEventData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            user_id: true
          }
        }
      }
    });
  }

  /**
   * 사용자 ID로 데모 이벤트 조회
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object|null>} 데모 이벤트 또는 null
   */
  async findDemoEventByUserId(userId) {
    return await prisma.demoEvent.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            user_id: true
          }
        }
      }
    });
  }

  /**
   * 공유 링크로 데모 이벤트 조회
   * @param {string} shareLink - 공유 링크
   * @returns {Promise<Object|null>} 데모 이벤트 또는 null
   */
  async findDemoEventByShareLink(shareLink) {
    return await prisma.demoEvent.findUnique({
      where: { shareLink },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            user_id: true
          }
        }
      }
    });
  }

  /**
   * 데모 이벤트 업데이트
   * @param {number} demoEventId - 데모 이벤트 ID
   * @param {Object} updateData - 업데이트할 데이터
   * @returns {Promise<Object>} 업데이트된 데모 이벤트
   */
  async updateDemoEvent(demoEventId, updateData) {
    return await prisma.demoEvent.update({
      where: { id: demoEventId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            user_id: true
          }
        }
      }
    });
  }

  /**
   * 데모 이벤트 삭제
   * @param {number} demoEventId - 데모 이벤트 ID
   */
  async deleteDemoEvent(demoEventId) {
    return await prisma.demoEvent.delete({
      where: { id: demoEventId }
    });
  }

  /**
   * 데모 편지 생성
   * @param {Object} letterData - 편지 데이터
   * @returns {Promise<Object>} 생성된 편지
   */
  async createDemoLetter(letterData) {
    return await prisma.demoLetter.create({
      data: letterData
    });
  }

  /**
   * 편지 ID로 데모 편지 조회
   * @param {number} letterId - 편지 ID
   * @returns {Promise<Object|null>} 편지 또는 null
   */
  async findDemoLetterById(letterId) {
    return await prisma.demoLetter.findUnique({
      where: { id: letterId },
      include: {
        demoEvent: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                user_id: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * 데모 이벤트 ID로 편지 목록 조회
   * @param {number} demoEventId - 데모 이벤트 ID
   * @param {number} skip - 건너뛸 개수
   * @param {number} take - 가져올 개수
   * @returns {Promise<Array>} 편지 목록
   */
  async findDemoLettersByEventId(demoEventId, skip, take) {
    return await prisma.demoLetter.findMany({
      where: { demoEventId },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * 데모 이벤트 ID로 편지 개수 조회
   * @param {number} demoEventId - 데모 이벤트 ID
   * @returns {Promise<number>} 편지 개수
   */
  async countDemoLettersByEventId(demoEventId) {
    return await prisma.demoLetter.count({
      where: { demoEventId }
    });
  }

  /**
   * 데모 편지 읽음 처리
   * @param {number} letterId - 편지 ID
   */
  async markDemoLetterAsRead(letterId) {
    return await prisma.demoLetter.update({
      where: { id: letterId },
      data: { isRead: true }
    });
  }

  /**
   * 데모 편지 삭제
   * @param {number} letterId - 편지 ID
   */
  async deleteDemoLetter(letterId) {
    return await prisma.demoLetter.delete({
      where: { id: letterId }
    });
  }

  /**
   * 사용자의 읽지 않은 데모 편지 개수 조회
   * @param {number} userId - 사용자 ID
   * @returns {Promise<number>} 읽지 않은 편지 개수
   */
  async countUnreadDemoLettersByUserId(userId) {
    const demoEvent = await this.findDemoEventByUserId(userId);
    if (!demoEvent) return 0;

    return await prisma.demoLetter.count({
      where: {
        demoEventId: demoEvent.id,
        isRead: false
      }
    });
  }
}

export const demoRepository = new DemoRepository();
