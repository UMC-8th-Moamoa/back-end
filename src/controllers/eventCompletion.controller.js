import { eventCompletionService } from '../services/eventCompletion.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';

class EventCompletionController {
  /**
   * 이벤트 완료 후 처리 상태 조회
   * GET /api/birthdays/me/event/status
   */
  getEventStatus = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await eventCompletionService.getEventStatus(userId);
    res.success(result);
  });

  /**
   * 남은 금액 처리 선택지 조회
   * GET /api/birthdays/me/event/remaining
   */
  getRemainingOptions = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await eventCompletionService.getRemainingOptions(userId);
    res.success(result);
  });

  /**
   * 몽코인 전환 미리보기
   * GET /api/birthdays/me/event/preview
   */
  getConversionPreview = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await eventCompletionService.getConversionPreview(userId);
    res.success(result);
  });

  /**
   * 기부 처리
   * POST /api/birthdays/me/event/donate
   */
  processDonation = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).error({
        errorCode: 'C001',
        reason: '기부 단체를 선택해주세요'
      });
    }

    const result = await eventCompletionService.processDonation(userId, organizationId);
    res.success(result);
  });

  /**
   * 몽코인 전환 처리
   * POST /api/birthdays/me/event/convert
   */
  convertToCoins = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await eventCompletionService.convertToCoins(userId);
    res.success(result);
  });

  /**
   * 편지함 조회
   * GET /api/birthdays/me/event/letters
   */
  getEventLetters = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await eventCompletionService.getEventLetters(userId);
    res.success(result);
  });
}

export default new EventCompletionController();
