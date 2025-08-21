import PaymentService from '../services/payment.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';

/**
 * 결제 및 포인트 관리 컨트롤러
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



  /**
   * 몽코인 충전하기
   * POST /api/payment/charge
   */
  chargeMongcoin = catchAsync(async (req, res) => {
    const { packageId } = req.body;
    const userId = req.user.id;
    
    if (!packageId) {
      return res.status(400).error({
        errorCode: 'VALIDATION_ERROR',
        reason: '충전 패키지 ID가 필요합니다'
      });
    }
    
    try {
      const result = await PaymentService.purchaseChargePackage(userId, packageId);
      
      res.success({
        message: '몽코인 충전이 완료되었습니다!',
        packageInfo: result.packageInfo,
        newBalance: result.newBalance,
        chargedAmount: result.chargedAmount,
        transaction: {
          id: result.transactionId,
          createdAt: result.createdAt
        }
      });
      
    } catch (error) {
      if (error.message === 'PACKAGE_NOT_FOUND') {
        return res.status(404).error({
          errorCode: 'PACKAGE_NOT_FOUND',
          reason: '존재하지 않는 충전 패키지입니다'
        });
      }
      
      throw error;
    }
  });

  /**
   * 충전 내역 조회
   * GET /api/payment/charge-history
   */
  getChargeHistory = catchAsync(async (req, res) => {
    const { limit = 10 } = req.query;
    const userId = req.user.id;
    
    const history = await PaymentService.getChargeHistory(userId, parseInt(limit));
    
    res.success({
      history: history
    });
  });
}

export default new PaymentController();