import { myBirthdayWishlistRepository } from '../repositories/myBirthdayWishlist.repository.js';
import { NotFoundError, ValidationError } from '../middlewares/errorHandler.js';
import { toKSTISOString } from '../utils/datetime.util.js';

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

      // 1. 현재 완료된 이벤트 조회
      const currentEvent = await myBirthdayWishlistRepository.getCurrentEventByUserId(userId);
      
      if (!currentEvent) {
        throw new NotFoundError('완료된 생일 이벤트가 없습니다');
      }

      // 2. 현재 모금액 조회
      const currentAmount = await myBirthdayWishlistRepository.getCurrentAmount(currentEvent.id);

      // 3. 생일자가 실제 선택한 상품들 조회 (구매 예정 상품들)
      const selectedProductIds = await myBirthdayWishlistRepository.getBirthdayPersonSelectedProducts(currentEvent.id);
      
      // 4. 선택된 상품들의 총 금액 (생일자가 선택한 상품들 기준)
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
          addedAt: toKSTISOString(product.createdAt),
          voteCount: product.voteCount
        })),
        pagination: {
          hasNext,
          nextCursor,
          totalCount
        },
        selectedItems: selectedProductIds,  // 생일자가 직접 선택한 상품들 (구매 예정)
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
    const validSortOptions = ['CREATED_AT', 'VOTE_COUNT', 'PRICE_DESC', 'PRICE_ASC'];
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
      'VOTE_COUNT': '투표순',
      'PRICE_DESC': '높은 가격순',
      'PRICE_ASC': '낮은 가격순'
    };

    return sortNames[sortBy] || '등록순';
  }

  /**
   * 위시리스트 상품 선택
   * @param {number} userId - 생일자 사용자 ID
   * @param {Array<number>} wishlistIds - 선택할 위시리스트 상품 ID 배열
   * @returns {Object} 선택 결과
   */
  async selectWishlistProducts(userId, wishlistIds) {
    try {
      // 완료된 생일 이벤트 조회
      const currentEvent = await myBirthdayWishlistRepository.getCurrentEventByUserId(userId);
      if (!currentEvent) {
        return {
          resultType: 'FAIL',
          error: {
            errorCode: 'EVENT_NOT_FOUND',
            reason: '완료된 생일 이벤트가 없습니다'
          }
        };
      }

      // 기존 선택 삭제 후 새로 선택
      await myBirthdayWishlistRepository.deleteSelectedProducts(currentEvent.id);

      if (wishlistIds.length > 0) {
        // 선택한 위시리스트 상품들이 실제로 존재하는지 확인
        const validWishlists = await myBirthdayWishlistRepository.getWishlistsByIds(currentEvent.id, wishlistIds);
        if (validWishlists.length !== wishlistIds.length) {
          return {
            resultType: 'FAIL',
            error: {
              errorCode: 'WISHLIST_NOT_FOUND',
              reason: '존재하지 않는 위시리스트 상품이 포함되어 있습니다'
            }
          };
        }

        // 새로운 선택 저장
        await myBirthdayWishlistRepository.insertSelectedProducts(currentEvent.id, wishlistIds);
      }

      // 현재 모인 금액과 선택한 상품들의 총 금액 계산
      const currentAmount = await myBirthdayWishlistRepository.getCurrentAmount(currentEvent.id);
      const selectedProducts = wishlistIds.length > 0 
        ? await myBirthdayWishlistRepository.getSelectedProductsWithDetails(currentEvent.id)
        : [];
      
      const totalSelectedAmount = selectedProducts.reduce((sum, item) => {
        // 확장 레포지토리에서 반환하는 구조: { wishlist: { price: number } }
        return sum + (item.wishlist ? item.wishlist.price : 0);
      }, 0);
      const remainingAmount = currentAmount - totalSelectedAmount;

      return {
        resultType: 'SUCCESS',
        success: {
          wishlistIds,
          totalSelectedAmount,
          currentAmount,
          remainingAmount
        }
      };
    } catch (error) {
      console.error('위시리스트 상품 선택 중 오류:', error);
      return {
        resultType: 'FAIL',
        error: {
          errorCode: 'INTERNAL_SERVER_ERROR',
          reason: '서버 내부 오류가 발생했습니다'
        }
      };
    }
  }

  /**
   * 정산 가능 여부 확인
   * @param {number} userId - 생일자 사용자 ID
   * @param {Array<number>} wishlistIds - 확인할 위시리스트 상품 ID 배열
   * @returns {Object} 예산 확인 결과
   */
  async confirmBudget(userId, wishlistIds) {
    try {
      // 완료된 생일 이벤트 조회
      const currentEvent = await myBirthdayWishlistRepository.getCurrentEventByUserId(userId);
      if (!currentEvent) {
        return {
          resultType: 'FAIL',
          error: {
            errorCode: 'EVENT_NOT_FOUND',
            reason: '완료된 생일 이벤트가 없습니다'
          }
        };
      }

      // 선택한 위시리스트 상품들이 실제로 존재하는지 확인
      const validWishlists = await myBirthdayWishlistRepository.getWishlistsByIds(currentEvent.id, wishlistIds);
      if (validWishlists.length !== wishlistIds.length) {
        return {
          resultType: 'FAIL',
          error: {
            errorCode: 'WISHLIST_NOT_FOUND',
            reason: '존재하지 않는 위시리스트 상품이 포함되어 있습니다'
          }
        };
      }

      // 현재 모인 금액 조회
      const currentAmount = await myBirthdayWishlistRepository.getCurrentAmount(currentEvent.id);
      
      // 선택한 상품들의 총 금액 계산
      const totalSelectedAmount = validWishlists.reduce((sum, product) => sum + product.price, 0);
      
      const isOverBudget = totalSelectedAmount > currentAmount;
      const remainingAmount = currentAmount - totalSelectedAmount;
      const shortfallAmount = isOverBudget ? totalSelectedAmount - currentAmount : 0;

      const confirmedProducts = validWishlists.map(wishlist => ({
        id: wishlist.id,
        name: wishlist.productName,
        price: wishlist.price
      }));

      return {
        resultType: 'SUCCESS',
        success: {
          isOverBudget,
          confirmedProducts,
          totalSelectedAmount,
          currentAmount,
          remainingAmount: isOverBudget ? undefined : remainingAmount,
          shortfallAmount: isOverBudget ? shortfallAmount : undefined
        }
      };
    } catch (error) {
      console.error('예산 확인 중 오류:', error);
      return {
        resultType: 'FAIL',
        error: {
          errorCode: 'INTERNAL_SERVER_ERROR',
          reason: '서버 내부 오류가 발생했습니다'
        }
      };
    }
  }

  /**
   * 구글폼 정산 링크 제공
   * @param {number} userId - 생일자 사용자 ID
   * @returns {Object} 구글폼 링크 정보
   */
  async getSettlementFormLink(userId) {
    try {
      // 완료된 생일 이벤트 조회
      const currentEvent = await myBirthdayWishlistRepository.getCurrentEventByUserId(userId);
      if (!currentEvent) {
        return {
          resultType: 'FAIL',
          error: {
            errorCode: 'EVENT_NOT_FOUND',
            reason: '완료된 생일 이벤트가 없습니다'
          }
        };
      }

      // 현재 선택된 상품들 조회
      const selectedProducts = await myBirthdayWishlistRepository.getSelectedProductsWithDetails(currentEvent.id);
      
      if (selectedProducts.length === 0) {
        return {
          resultType: 'FAIL',
          error: {
            errorCode: 'NO_SELECTED_PRODUCTS',
            reason: '정산할 선택된 상품이 없습니다'
          }
        };
      }

      const currentAmount = await myBirthdayWishlistRepository.getCurrentAmount(currentEvent.id);
      const totalSelectedAmount = selectedProducts.reduce((sum, item) => {
        return sum + (item.wishlist ? item.wishlist.price : 0);
      }, 0);

      // 환경변수에서 구글폼 URL을 가져오거나 기본값 사용
      const googleFormUrl = process.env.SETTLEMENT_GOOGLE_FORM_URL || 'https://forms.gle/example123456';

      return {
        resultType: 'SUCCESS',
        success: {
          googleFormUrl,
          message: '구글폼을 통해 정산을 진행해주세요',
          eventId: currentEvent.id,
          selectedProducts: selectedProducts.map(item => ({
            wishlistId: item.wishlistId,
            productName: item.wishlist.productName,
            price: item.wishlist.price
          })),
          totalSelectedAmount,
          currentAmount,
          instructions: '구글폼에서 선택한 상품 정보와 계좌 정보를 입력하면 관리자가 출금을 처리해드립니다.'
        }
      };
    } catch (error) {
      console.error('구글폼 링크 조회 중 오류:', error);
      return {
        resultType: 'FAIL',
        error: {
          errorCode: 'INTERNAL_SERVER_ERROR',
          reason: '서버 내부 오류가 발생했습니다'
        }
      };
    }
  }
}

export const myBirthdayWishlistService = new MyBirthdayWishlistService();