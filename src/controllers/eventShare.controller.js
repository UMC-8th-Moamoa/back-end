import { eventShareService } from '../services/eventShare.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { 
  EventShareRequestDTO,
  EventShareResponseDTO 
} from '../dtos/eventShare.dto.js';

class EventShareController {
  /**
   * 이벤트 공유 URL 생성
   * POST /api/birthdays/events/{eventId}/share
   */
  async createShareUrl(req, res) {
    const userId = req.user.id;
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new EventShareRequestDTO(req.params, req.body);
    const { eventId, contentType, expiresAt } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const result = await eventShareService.createShareUrl(userId, {
      eventId,
      contentType,
      expiresAt
    });

    // 응답 데이터를 DTO로 변환
    const responseDTO = new EventShareResponseDTO(result);

    res.success(responseDTO.toResponse());
  }

  /**
   * 공유 링크로 이벤트 정보 조회 (공유 링크 접속 시 사용)
   * GET /api/birthdays/events/shared/{token}
   */
  async getEventByShareToken(req, res) {
    const { token } = req.params;

    if (!token) {
      return res.status(400).error({
        errorCode: 'B001',
        reason: '유효한 공유 토큰이 필요합니다',
        data: null
      });
    }

    // 서비스 레이어 호출
    const result = await eventShareService.getEventByShareToken(token);

    res.success(result);
  }
}

// 인스턴스 생성 및 catchAsync 래핑
const eventShareController = new EventShareController();

export default {
  createShareUrl: catchAsync(eventShareController.createShareUrl),
  getEventByShareToken: catchAsync(eventShareController.getEventByShareToken)
};