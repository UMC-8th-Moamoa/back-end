import { myBirthdayWishlistRepository } from '../repositories/myBirthdayWishlist.repository.js';
import { NotFoundError, ValidationError } from '../middlewares/errorHandler.js';

/**
 * 내 생일 위시리스트 서비스
 */
class MyBirthdayWishlistService {
  /**
   * 내 생일 이벤트 위시리스트 조회
   * @param {number} userId - 생일자 사용자 ID
   * @param {Object} queryParams - 쿼리 파라미터
   * @returns {Object} 위시리스트 데이터
   */
  async getMyBirthdayWishlist(userId, queryParams) {
    try {
      const { sortBy = 'CREATED_AT', cursor = null, limit = 10 } = queryParams;

      // 입력값 검증
      this.validateQueryParams({ sortBy, limit });

      // 1. 현재 활성 이벤트 조회
      const currentEvent = await myBirthdayWishlistRepository.getCurrentEventByUserId(userId);
      
      if (!currentEvent) {
        throw new NotFoundError('현재 진행 중인 생일 이벤트가 없습니다');
      }

      // 2. 현재 모금액 조회
      const currentAmount = await myBirthdayWishlistRepository.getCurrentAmount(currentEvent.id);

      // 3. 선택된 상품들 조회
      const selectedProductIds = await myBirthdayWishlistRepository.getSelectedProducts(currentEvent.id);

      // 4. 선택된 상품들의 총 금액
      const totalSelectedAmount = await myBirthdayWishlistRepository.getTotalSelectedAmount(selectedProductIds);

      // 5. 위시리스트 상품 목록 조회
      const products = await myBirthdayWishlistRepository.getWishlistProducts(
        userId, 
        { sortBy, cursor, limit: parseInt(limit), selectedProductIds, eventId: currentEvent.id }
      );

      // 6. 페이지네이션 처리
      const hasNext = products.length > limit;
      const actualProducts = hasNext ? products.slice(0, limit) : products;
      
      let nextCursor = null;
      if (hasNext && actualProducts.length > 0) {
        const lastItem = actualProducts[actualProducts.length - 1];
        nextCursor = myBirthdayWishlistRepository.createNextCursor(lastItem, sortBy);
      }

      // 7. 총 개수 조회
      const totalCount = await myBirthdayWishlistRepository.getTotalCount(userId);

      // 8. 남은 금액 계산
      const remainingAmount = Math.max(0, currentAmount - totalSelectedAmount);

      return {
        currentAmount,
        products: actualProducts.map(product => ({
          id: product.id,
          name: product.productName,
          price: product.price,
          image: product.productImageUrl,
          isSelected: product.isSelected,
          addedAt: product.createdAt.toISOString(),
          voteCount: product.voteCount // friendRecommendationCount에서 변경
        })),
        pagination: {
          hasNext,
          nextCursor,
          totalCount
        },
        selectedItems: selectedProductIds,  // selectedProducts → selectedItems로 변경
        totalSelectedAmount,
        remainingAmount
      };

    } catch (error) {
      console.error('위시리스트 조회 서비스 오류:', error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new Error('위시리스트 정보를 가져오는 중 오류가 발생했습니다');
    }
  }

  /**
   * 쿼리 파라미터 유효성 검사
   * @param {Object} params - 검증할 파라미터
   */
  validateQueryParams(params) {
    const { sortBy, limit } = params;

    // 정렬 기준 검증
    const validSortOptions = ['CREATED_AT', 'VOTE_COUNT', 'PRICE_DESC', 'PRICE_ASC']; // FRIEND_RECOMMENDATION을 VOTE_COUNT로 변경
    if (!validSortOptions.includes(sortBy)) {
      throw new ValidationError(`sortBy는 다음 값 중 하나여야 합니다: ${validSortOptions.join(', ')}`);
    }

    // 리미트 검증
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      throw new ValidationError('limit은 1-50 사이의 숫자여야 합니다');
    }
  }

  /**
   * 정렬 기준 한글명 반환
   * @param {string} sortBy - 정렬 기준
   * @returns {string} 한글 정렬명
   */
  getSortDisplayName(sortBy) {
    const sortNames = {
      'CREATED_AT': '등록순',
      'VOTE_COUNT': '투표순', // FRIEND_RECOMMENDATION에서 변경
      'PRICE_DESC': '높은 가격순',
      'PRICE_ASC': '낮은 가격순'
    };

    return sortNames[sortBy] || '등록순';
  }
}

export const myBirthdayWishlistService = new MyBirthdayWishlistService();