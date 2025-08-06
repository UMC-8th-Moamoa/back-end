import { catchAsync } from '../middlewares/errorHandler.js';
import { myBirthdayService } from '../services/myBirthday.service.js';
import { MyBirthdayResponseDTO } from '../dtos/myBirthday.dto.js';

/**
 * 내 생일 이벤트 관련 컨트롤러
 */
class MyBirthdayController {
  /**
   * 현재 진행 중인 생일 이벤트 정보 조회
   * GET /api/birthdays/me/event
   */
  static getCurrentEvent = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    // 서비스 레이어 호출
    const eventData = await myBirthdayService.getCurrentEvent(userId);

    // 응답 데이터를 DTO로 변환
    const responseDTO = new MyBirthdayResponseDTO(eventData);

    res.success(responseDTO.toResponse());
  });
}

export default MyBirthdayController;