import { upcomingBirthdayService } from '../services/upcomingBirthday.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { UpcomingBirthdayRequestDTO, UpcomingBirthdayResponseDTO } from '../dtos/upcomingBirthday.dto.js';

class UpcomingBirthdayController {
  /**
   * 다가오는 친구의 생일 목록 조회 (스와이프 형식으로 3개씩)
   * GET /api/birthdays/upcoming?limit=3&cursor={cursor}&direction=next
   */
  async getUpcomingBirthdays(req, res) {
    const userId = req.user.id;
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new UpcomingBirthdayRequestDTO(req.query);
    const { days, limit, cursor, direction } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const result = await upcomingBirthdayService.getUpcomingBirthdays(userId, {
      days,
      limit,
      cursor,
      direction
    });

    // 응답 데이터를 DTO로 변환
    const responseDTO = new UpcomingBirthdayResponseDTO(result);

    res.success(responseDTO.toResponse());
  }
}

// 인스턴스 생성 및 catchAsync 래핑
const upcomingBirthdayController = new UpcomingBirthdayController();

export default {
  getUpcomingBirthdays: catchAsync(upcomingBirthdayController.getUpcomingBirthdays)
};