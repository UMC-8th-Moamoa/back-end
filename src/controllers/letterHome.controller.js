import { catchAsync } from '../middlewares/errorHandler.js';
import { letterHomeService } from '../services/letterHome.service.js';
import { LetterHomeRequestDTO, LetterHomeResponseDTO } from '../dtos/letterHome.dto.js';


//편지 홈 화면 관련 컨트롤러

class LetterHomeController {
  /**
   * 홈 화면 편지 목록 조회 (스와이프용)
   * GET /api/home/letters
   */
  static getLetters = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new LetterHomeRequestDTO(req.query);
    const { limit, cursor, direction } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const result = await letterHomeService.getLetters(userId, {
      limit,
      cursor,
      direction
    });

    // 응답 데이터를 DTO로 변환
    const responseDTO = new LetterHomeResponseDTO(result);

    res.success(responseDTO.toResponse());
  });
}

export default LetterHomeController;