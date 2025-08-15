import { catchAsync } from '../middlewares/errorHandler.js';
import { letterHomeService } from '../services/letterHome.service.js';
import { LetterHomeRequestDTO, LetterHomeResponseDTO } from '../dtos/letterHome.dto.js';

class LetterHomeController {
  /**
   * 홈 화면 편지 목록 조회 (스와이프용)
   * GET /api/home/letters
   */
  async getLetters(req, res) {
    const userId = req.user?.id;
    
    // 사용자 인증 확인
    if (!userId) {
      return res.status(401).error({
        errorCode: 'UNAUTHORIZED',
        reason: '사용자 인증 정보가 없습니다'
      });
    }
    
    try {
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
      
    } catch (error) {
      console.error('LetterHome Controller Error:', error);
      
      // ValidationError인 경우 400 에러로 처리
      if (error.message && error.message.includes('유효하지 않은')) {
        return res.status(400).error({
          errorCode: 'VALIDATION_ERROR',
          reason: error.message
        });
      }
      
      // 그 외의 경우 500 에러
      throw error;
    }
  }
}

// 인스턴스 생성 및 catchAsync 래핑
const letterHomeController = new LetterHomeController();

export default {
  getLetters: catchAsync(letterHomeController.getLetters)
};