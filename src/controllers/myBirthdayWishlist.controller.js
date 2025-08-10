import { catchAsync } from '../middlewares/errorHandler.js';
import { myBirthdayWishlistService } from '../services/myBirthdayWishlist.service.js';
import { MyBirthdayWishlistRequestDTO, MyBirthdayWishlistResponseDTO } from '../dtos/myBirthdayWishlist.dto.js';

/**
 * 내 생일 위시리스트 컨트롤러
 */
class MyBirthdayWishlistController {
  /**
   * 내 생일 이벤트 위시리스트 조회
   * GET /api/birthdays/me/event/wishlist
   */
  static getMyBirthdayWishlist = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new MyBirthdayWishlistRequestDTO(req.query);
    const { sortBy, cursor, limit } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const wishlistData = await myBirthdayWishlistService.getMyBirthdayWishlist(userId, {
      sortBy,
      cursor,
      limit
    });

    // 응답 데이터를 DTO로 변환
    const responseDTO = new MyBirthdayWishlistResponseDTO(wishlistData);

    res.success(responseDTO.toResponse());
  });

  /**
   * 위시리스트 상품 선택
   * PUT /api/birthdays/me/event/wishlist/select
   */
  static selectWishlistProducts = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { wishlistIds } = req.body;

    // wishlistIds 유효성 검사
    if (!Array.isArray(wishlistIds)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "wishlistIds는 배열이어야 합니다"
        }
      });
    }

    const result = await myBirthdayWishlistService.selectWishlistProducts(userId, wishlistIds);
    
    if (result.resultType === 'FAIL') {
      const statusCode = result.error.errorCode === 'EVENT_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error.errorCode,
          message: result.error.reason
        }
      });
    }

    res.status(200).json({
      success: true,
      data: result.success
    });
  });

  /**
   * 정산 가능 여부 확인
   * POST /api/birthdays/me/event/wishlist/confirm
   */
  static confirmBudget = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { wishlistIds } = req.body;

    // wishlistIds 유효성 검사
    if (!Array.isArray(wishlistIds)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "wishlistIds는 배열이어야 합니다"
        }
      });
    }

    const result = await myBirthdayWishlistService.confirmBudget(userId, wishlistIds);
    
    if (result.resultType === 'FAIL') {
      const statusCode = result.error.errorCode === 'EVENT_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error.errorCode,
          message: result.error.reason
        }
      });
    }

    // 예산 초과 시 success: false로 응답
    if (result.success.isOverBudget) {
      return res.status(200).json({
        success: false,
        error: {
          code: "BUDGET_EXCEEDED",
          message: "예산이 초과되었습니다",
          data: {
            selectedProducts: wishlistIds,
            totalSelectedAmount: result.success.totalSelectedAmount,
            currentAmount: result.success.currentAmount,
            shortfallAmount: result.success.shortfallAmount
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        confirmedProducts: result.success.confirmedProducts,
        totalSelectedAmount: result.success.totalSelectedAmount,
        currentAmount: result.success.currentAmount,
        remainingAmount: result.success.remainingAmount
      }
    });
  });

  /**
   * 구글폼 정산 링크 제공
   * GET /api/birthdays/me/event/formlink
   */
  static getSettlementFormLink = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const result = await myBirthdayWishlistService.getSettlementFormLink(userId);
    
    if (result.resultType === 'FAIL') {
      const statusCode = result.error.errorCode === 'EVENT_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: result.error.errorCode,
          message: result.error.reason
        }
      });
    }

    res.status(200).json({
      success: true,
      data: result.success
    });
  });
}

export default MyBirthdayWishlistController;