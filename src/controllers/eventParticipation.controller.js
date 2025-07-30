import { eventParticipationService } from '../services/eventParticipation.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { 
  EventParticipationInfoRequestDTO, 
  EventParticipationRequestDTO,
  EventParticipationInfoResponseDTO,
  EventParticipationResponseDTO 
} from '../dtos/eventParticipation.dto.js';

class EventParticipationController {
  /**
   * 이벤트 참여 화면 정보 조회
   * GET /api/birthdays/events/{eventId}/participation
   */
  async getParticipationInfo(req, res) {
    const userId = req.user.id;
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new EventParticipationInfoRequestDTO(req.params);
    const { eventId } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const result = await eventParticipationService.getParticipationInfo(userId, eventId);

    // 응답 데이터를 DTO로 변환
    const responseDTO = new EventParticipationInfoResponseDTO(result);

    res.success(responseDTO.toResponse());
  }

  /**
   * 이벤트 참여 (송금하고/송금없이)
   * POST /api/birthdays/events/{eventId}/participation
   */
  async participateInEvent(req, res) {
    const userId = req.user.id;
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new EventParticipationRequestDTO(req.params, req.body);
    const { eventId, participationType, amount } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const result = await eventParticipationService.participateInEvent(userId, {
      eventId,
      participationType,
      amount
    });

    // 응답 데이터를 DTO로 변환
    const responseDTO = new EventParticipationResponseDTO(result);

    res.success(responseDTO.toResponse());
  }
}

// 인스턴스 생성 및 catchAsync 래핑
const eventParticipationController = new EventParticipationController();

export default {
  getParticipationInfo: catchAsync(eventParticipationController.getParticipationInfo),
  participateInEvent: catchAsync(eventParticipationController.participateInEvent)
};