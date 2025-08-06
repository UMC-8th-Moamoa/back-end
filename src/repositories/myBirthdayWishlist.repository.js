import prisma from '../config/prismaClient.js';

/**
 * 내 생일 위시리스트 레포지토리
 */
class MyBirthdayWishlistRepository {
  /**
   * 현재 활성 이벤트 ID 조회
   * @param {number} userId - 생일자 사용자 ID
   * @returns {Object|null} 이벤트 정보
   */
  async getCurrentEventByUserId(userId) {
    const event = await prisma.birthdayEvent.findFirst({
      where: {
        birthdayPersonId: userId,
        status: 'ACTIVE',
        deadline: {
          gte: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return event;
  }

  /**
   * 현재 이벤트의 총 모금액 조회
   * @param {number} eventId - 이벤트 ID
   * @returns {number} 총 모금액
   */
  async getCurrentAmount(eventId) {
    const result = await prisma.contribution.aggregate({
      where: {
        eventId: eventId
      },
      _sum: {
        amount: true
      }
    });

    return result._sum.amount || 0;
  }

  /**
   * 생일자의 위시리스트 상품 전체 조회 (투표용)
   * @param {number} userId - 생일자 사용자 ID
   * @param {number} eventId - 이벤트 ID (투표 수 조회용)
   * @returns {Array} 위시리스트 상품 목록
   */
  async getBirthdayWishlistForVoting(userId, eventId) {
    const products = await prisma.wishlist.findMany({
      where: {
        userId: userId,
        isPublic: true
      },
      select: {
        id: true,
        productName: true,
        price: true,
        productImageUrl: true,
        productUrl: true,
        votes: {
          where: { eventId: eventId },
          select: { id: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return products.map(product => ({
      itemId: product.id,
      productName: product.productName,
      price: product.price,
      productImageUrl: product.productImageUrl,
      productUrl: product.productUrl,
      currentVoteCount: product.votes.length
    }));
  }

  /**
   * 위시리스트 상품에 투표하기
   * @param {number} userId - 투표자 ID
   * @param {number} wishlistId - 위시리스트 상품 ID
   * @param {number} eventId - 이벤트 ID
   * @returns {Object} 생성된 투표 정보
   */
  async addVote(userId, wishlistId, eventId) {
    return await prisma.wishlistVote.create({
      data: {
        userId,
        wishlistId,
        eventId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photo: true
          }
        },
        wishlist: {
          select: {
            id: true,
            productName: true
          }
        }
      }
    });
  }

  /**
   * 투표 결과 조회 - 모든 위시리스트 상품의 투표 수와 함께 조회
   * @param {number} userId - 생일자 사용자 ID
   * @param {number} eventId - 이벤트 ID
   * @returns {Array} 투표 결과 목록 (투표 수 순으로 정렬)
   */
  async getVoteResults(userId, eventId) {
    const products = await prisma.wishlist.findMany({
      where: {
        userId: userId,
        isPublic: true
      },
      select: {
        id: true,
        productName: true,
        price: true,
        productImageUrl: true,
        productUrl: true,
        votes: {
          where: { eventId: eventId },
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                photo: true
              }
            }
          }
        }
      },
      orderBy: {
        votes: {
          _count: 'desc'
        }
      }
    });

    return products.map(product => ({
      itemId: product.id,
      productName: product.productName,
      price: product.price,
      productImageUrl: product.productImageUrl,
      productUrl: product.productUrl,
      voteCount: product.votes.length,
      voters: product.votes.map(vote => ({
        id: vote.user.id,
        name: vote.user.name,
        photo: vote.user.photo
      }))
    }));
  }
}

export const myBirthdayWishlistRepository = new MyBirthdayWishlistRepository();