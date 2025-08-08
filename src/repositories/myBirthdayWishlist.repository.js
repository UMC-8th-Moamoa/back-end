import prisma from '../config/prismaClient.js';

/**
 * 내 생일 위시리스트 레포지토리
 */
class MyBirthdayWishlistRepository {
  // ===== 이벤트 관련 메서드 =====
  
  /**
   * 현재 완료된 이벤트 조회 (가장 최근 완료된 이벤트)
   * @param {number} userId - 생일자 사용자 ID
   * @returns {Object|null} 이벤트 정보
   */
  async getCurrentEventByUserId(userId) {
    const event = await prisma.birthdayEvent.findFirst({
      where: {
        birthdayPersonId: userId,
        status: 'completed'
      },
      orderBy: {
        updatedAt: 'desc' // 가장 최근 완료된 이벤트
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
    const result = await prisma.birthdayEventParticipant.aggregate({
      where: {
        eventId: eventId
      },
      _sum: {
        amount: true
      }
    });

    return result._sum.amount || 0;
  }

  // ===== 위시리스트 조회 메서드 =====

  /**
   * 위시리스트 상품 목록 조회 (페이징 포함)
   * @param {number} userId - 생일자 사용자 ID
   * @param {Object} options - 조회 옵션
   * @returns {Array} 위시리스트 상품 목록
   */
  async getWishlistProducts(userId, options) {
    const { sortBy = 'CREATED_AT', cursor = null, limit = 10, selectedProductIds = [], eventId } = options;
    
    const whereCondition = {
      userId: userId,
      isPublic: true
    };

    // 커서 기반 페이징
    if (cursor) {
      whereCondition.id = { lt: parseInt(cursor) };
    }

    let orderBy = {};
    switch (sortBy) {
      case 'CREATED_AT':
        orderBy = { createdAt: 'desc' };
        break;
      case 'VOTE_COUNT':
        orderBy = { votes: { _count: 'desc' } };
        break;
      case 'PRICE_DESC':
        orderBy = { price: 'desc' };
        break;
      case 'PRICE_ASC':
        orderBy = { price: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const products = await prisma.wishlist.findMany({
      where: whereCondition,
      include: {
        votes: {
          where: { eventId: eventId },
          select: { id: true }
        }
      },
      orderBy: orderBy,
      take: limit + 1 // hasNext 확인을 위해 +1
    });

    return products.map(product => {
      const voteCount = product.votes.length;
      return {
        ...product,
        isSelected: selectedProductIds.includes(product.id), // 생일자가 선택한 상품은 선택됨으로 표시
        voteCount: voteCount
      };
    });
  }

  /**
   * 위시리스트 상품들을 ID로 조회
   * @param {number} eventId - 이벤트 ID
   * @param {Array<number>} wishlistIds - 위시리스트 ID 배열
   * @returns {Array} 위시리스트 상품 정보 배열
   */
  async getWishlistsByIds(eventId, wishlistIds) {
    // 이벤트 정보를 통해 생일자 ID 얻기
    const event = await prisma.birthdayEvent.findUnique({
      where: { id: eventId },
      select: { birthdayPersonId: true }
    });

    if (!event) {
      return [];
    }

    return await prisma.wishlist.findMany({
      where: {
        id: {
          in: wishlistIds
        },
        userId: event.birthdayPersonId
      },
      select: {
        id: true,
        productName: true,
        price: true
      }
    });
  }

  /**
   * 총 위시리스트 개수 조회
   * @param {number} userId - 사용자 ID
   * @returns {number} 총 개수
   */
  async getTotalCount(userId) {
    return await prisma.wishlist.count({
      where: {
        userId: userId,
        isPublic: true
      }
    });
  }

  // ===== 상품 선택 관련 메서드 =====

  /**
   * 생일자가 선택한 상품 ID 목록 조회 (실제 구매할 상품들)
   * @param {number} eventId - 이벤트 ID
   * @returns {Array} 생일자가 선택한 상품 ID 배열
   */
  async getBirthdayPersonSelectedProducts(eventId) {
    const selectedItems = await prisma.birthdayEventSelectedItem.findMany({
      where: {
        eventId: eventId
      },
      select: {
        wishlistId: true
      }
    });

    return selectedItems.map(item => item.wishlistId);
  }

  /**
   * 선택된 상품들을 삭제
   * @param {number} eventId - 이벤트 ID
   */
  async deleteSelectedProducts(eventId) {
    return await prisma.birthdayEventSelectedItem.deleteMany({
      where: {
        eventId: eventId
      }
    });
  }

  /**
   * 선택된 상품들을 저장
   * @param {number} eventId - 이벤트 ID
   * @param {Array<number>} wishlistIds - 위시리스트 ID 배열
   */
  async insertSelectedProducts(eventId, wishlistIds) {
    const insertData = wishlistIds.map(wishlistId => ({
      eventId: eventId,
      wishlistId: wishlistId
    }));

    return await prisma.birthdayEventSelectedItem.createMany({
      data: insertData
    });
  }

  /**
   * 선택된 상품들의 상세 정보 조회
   * @param {number} eventId - 이벤트 ID
   * @returns {Array} 선택된 상품들의 상세 정보
   */
  async getSelectedProductsWithDetails(eventId) {
    return await prisma.birthdayEventSelectedItem.findMany({
      where: {
        eventId: eventId
      },
      include: {
        wishlist: {
          select: {
            id: true,
            productName: true,
            price: true,
            productImageUrl: true
          }
        }
      }
    });
  }

  // ===== 계산 및 유틸리티 메서드 =====

  /**
   * 선택된 상품들의 총 금액 계산
   * @param {Array} productIds - 상품 ID 배열
   * @returns {number} 총 금액
   */
  async getTotalSelectedAmount(productIds) {
    if (!productIds || productIds.length === 0) {
      return 0;
    }

    const result = await prisma.wishlist.aggregate({
      where: {
        id: {
          in: productIds
        }
      },
      _sum: {
        price: true
      }
    });

    return result._sum.price || 0;
  }

  /**
   * 다음 커서 생성
   * @param {Object} lastItem - 마지막 아이템
   * @param {string} sortBy - 정렬 기준
   * @returns {string} 다음 커서
   */
  createNextCursor(lastItem, sortBy) {
    return lastItem.id.toString();
  }

  // ===== 사용하지 않는 메서드 (제거 예정) =====

  /**
   * @deprecated 이 메서드는 사용되지 않습니다. getBirthdayPersonSelectedProducts를 사용하세요.
   * 선택된 상품 ID 목록 조회 (모든 위시리스트 상품 ID 반환)
   * @param {number} eventId - 이벤트 ID
   * @param {number} userId - 생일자 사용자 ID  
   * @returns {Array} 모든 위시리스트 상품 ID 배열
   */
  async getSelectedProducts(eventId, userId = null) {
    // 모든 위시리스트 상품 ID를 반환 (투표 여부 관계없이)
    const products = await prisma.wishlist.findMany({
      where: {
        userId: userId, // userId가 있으면 해당 사용자의 위시리스트만
        isPublic: true
      },
      select: {
        id: true
      }
    });

    return products.map(product => product.id);
  }

  /**
   * 총 위시리스트 개수 조회
   * @param {number} userId - 사용자 ID
   * @returns {number} 총 개수
   */
  async getTotalCount(userId) {
    return await prisma.wishlist.count({
      where: {
        userId: userId,
        isPublic: true
      }
    });
  }

  /**
   * 선택된 상품들을 삭제
   * @param {number} eventId - 이벤트 ID
   */
  async deleteSelectedProducts(eventId) {
    return await prisma.birthdayEventSelectedItem.deleteMany({
      where: {
        eventId: eventId
      }
    });
  }

  /**
   * 위시리스트 상품들을 ID로 조회
   * @param {number} eventId - 이벤트 ID
   * @param {Array<number>} wishlistIds - 위시리스트 ID 배열
   */
  async getWishlistsByIds(eventId, wishlistIds) {
    // 이벤트 정보를 통해 생일자 ID 얻기
    const event = await prisma.birthdayEvent.findUnique({
      where: { id: eventId },
      select: { birthdayPersonId: true }
    });

    if (!event) {
      return [];
    }

    return await prisma.wishlist.findMany({
      where: {
        id: {
          in: wishlistIds
        },
        userId: event.birthdayPersonId
      },
      select: {
        id: true,
        productName: true,
        price: true
      }
    });
  }

  /**
   * 선택된 상품들을 저장
   * @param {number} eventId - 이벤트 ID
   * @param {Array<number>} wishlistIds - 위시리스트 ID 배열
   */
  async insertSelectedProducts(eventId, wishlistIds) {
    const insertData = wishlistIds.map(wishlistId => ({
      eventId: eventId,
      wishlistId: wishlistId
    }));

    return await prisma.birthdayEventSelectedItem.createMany({
      data: insertData
    });
  }

  /**
   * 선택된 상품들의 상세 정보 조회
   * @param {number} eventId - 이벤트 ID
   */
  async getSelectedProductsWithDetails(eventId) {
    return await prisma.birthdayEventSelectedItem.findMany({
      where: {
        eventId: eventId
      },
      include: {
        wishlist: {
          select: {
            id: true,
            productName: true,
            price: true,
            productImageUrl: true
          }
        }
      }
    });
  }
}

export const myBirthdayWishlistRepository = new MyBirthdayWishlistRepository();