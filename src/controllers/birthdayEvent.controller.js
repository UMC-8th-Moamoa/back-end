import { birthdayEventService } from '../services/birthdayEvent.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { BirthdayEventRequestDTO, BirthdayEventResponseDTO } from '../dtos/birthdayEvent.dto.js';

class BirthdayEventController {
  /**
   * 생일 이벤트 상세 정보 조회
   * GET /api/birthdays/events/{eventId}
   */
  async getEventDetail(req, res) {
    const userId = req.user.id;
    const { eventId } = req.params;
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new BirthdayEventRequestDTO(req.params, req.query);
    const { eventId: validatedEventId, wishlistPage, wishlistSize } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const result = await birthdayEventService.getEventDetail(userId, {
      eventId: validatedEventId,
      wishlistPage,
      wishlistSize
    });

    // 응답 데이터를 DTO로 변환
    const responseDTO = new BirthdayEventResponseDTO(result);

    res.success(responseDTO.toResponse());
  }
}

// 인스턴스 생성 및 catchAsync 래핑
const birthdayEventController = new BirthdayEventController();

export default {
  getEventDetail: catchAsync(birthdayEventController.getEventDetail)
};