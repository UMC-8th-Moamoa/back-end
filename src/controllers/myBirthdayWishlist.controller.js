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
}

export default MyBirthdayWishlistController;