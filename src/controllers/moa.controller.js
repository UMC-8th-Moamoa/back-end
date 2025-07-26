import { moaService } from '../services/moa.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { MoaRequestDTO } from '../dtos/moa.dto.js';

class MoaController {
// 사용자가 참여한 모아모아 목록 조회 (스와이프용)
  async getMoas(req, res) {
    const userId = req.user.id; // JWT에서 추출한 사용자 ID
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new MoaRequestDTO(req.query);
    const { limit, cursor, direction } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const moaData = await moaService.getMoas(userId, {
      limit,
      cursor: requestDTO.getDecodedCursor(),
      direction
    });

    res.success(moaData);
  }
}

const moaController = new MoaController();

export default {
  getMoas: catchAsync(moaController.getMoas)
};