import { catchAsync } from '../middlewares/errorHandler.js';
import { letterHomeService } from '../services/letterHome.service.js';
import { LetterHomeRequestDTO, LetterHomeResponseDTO } from '../dtos/letterHome.dto.js';

class LetterHomeController {
  /**
   * 홈 화면 편지 목록 조회 (스와이프용)
   * GET /api/home/letters
   */
  async getLetters(req, res) {
    console.log('🔍 [letterHome] API 호출 시작');
    console.log('🔍 [letterHome] 환경:', process.env.NODE_ENV);
    console.log('🔍 [letterHome] 현재 시간:', new Date().toISOString());
    
    const userId = req.user?.id;
    console.log('🔍 [letterHome] userId:', userId);
    
    // 사용자 인증 확인
    if (!userId) {
      console.log('❌ [letterHome] 인증 실패');
      return res.status(401).error({
        errorCode: 'UNAUTHORIZED',
        reason: '사용자 인증 정보가 없습니다'
      });
    }
    
    try {
      console.log('🔍 [letterHome] req.query:', JSON.stringify(req.query));
      
      // 요청 데이터를 DTO로 변환 및 검증
      const requestDTO = new LetterHomeRequestDTO(req.query);
      console.log('🔍 [letterHome] DTO 생성 완료');
      
      const { limit, cursor, direction } = requestDTO.getValidatedData();
      console.log('🔍 [letterHome] 검증된 데이터:', { limit, cursor, direction });

      // 서비스 레이어 호출
      const result = await letterHomeService.getLetters(userId, {
        limit,
        cursor,
        direction
      });
      console.log('🔍 [letterHome] 서비스 호출 완료');

      // 응답 데이터를 DTO로 변환
      const responseDTO = new LetterHomeResponseDTO(result);
      console.log('🔍 [letterHome] 응답 DTO 생성 완료');

      res.success(responseDTO.toResponse());
      console.log('✅ [letterHome] 성공 응답 완료');
      
    } catch (error) {
      console.error('❌ [letterHome] Controller Error:', error);
      console.error('❌ [letterHome] Error Stack:', error.stack);
      console.error('❌ [letterHome] Error Message:', error.message);
      
      // ValidationError인 경우 400 에러로 처리
      if (error.message && error.message.includes('유효하지 않은')) {
        console.log('⚠️ [letterHome] Validation Error 처리');
        return res.status(400).error({
          errorCode: 'VALIDATION_ERROR',
          reason: error.message
        });
      }
      
      // 그 외의 경우 500 에러
      console.log('🚨 [letterHome] 500 에러로 전달');
      throw error;
    }
  }
}

// 인스턴스 생성 및 catchAsync 래핑
const letterHomeController = new LetterHomeController();

export default {
  getLetters: catchAsync(letterHomeController.getLetters)
};