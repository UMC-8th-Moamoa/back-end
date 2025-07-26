import { birthdayService } from '../services/birthday.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';

class BirthdayController {
// 사용자 생일 카운트다운 조회

  async getBirthdayCountdown(req, res) {
    const userId = req.user.id; // JWT에서 추출한 사용자 ID
    
    // 서비스 레이어 호출
    const countdownData = await birthdayService.getBirthdayCountdown(userId);
    
    res.success(countdownData);
  }
}

// 인스턴스 생성 및 catchAsync 래핑
const birthdayController = new BirthdayController();

export default {
  getBirthdayCountdown: catchAsync(birthdayController.getBirthdayCountdown)
};