import PaymentService from '../services/payment.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';

/**
 * 결제 및 포인트 관리 컨트롤러 (최소 버전)
 */
class PaymentController {

  /**
   * 현재 사용자 보유 몽코인 조회
   * GET /api/payment/balance
   */
  getBalance = catchAsync(async (req, res) => {
    const result = await PaymentService.getUserBalance(req.user.id);
    
    res.success({
      balance: result.balance || 0,
      userId: result.userStringId,
      name: result.name
    });
  });
}

export default new PaymentController();