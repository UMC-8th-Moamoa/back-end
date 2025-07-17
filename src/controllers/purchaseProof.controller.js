import PurchaseProofService from '../services/purchaseProof.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { 
  PurchaseProofRequestDTO, 
  PurchaseProofResponseDTO 
} from '../dtos/purchaseProof.dto.js';

/**
 * 구매 인증 관련 컨트롤러
 */
class PurchaseProofController {
  /**
   * 선물 구매 인증 등록
   * POST /api/birthday-events/{eventId}/proof
   */
  static createPurchaseProof = catchAsync(async (req, res) => {
    const userId = req.user.id; // JWT에서 추출한 사용자 ID
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new PurchaseProofRequestDTO(req.params, req.body);
    const { eventId, proofImages, message } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const result = await PurchaseProofService.createPurchaseProof(
      userId,
      eventId,
      {
        proofImages,
        message
      }
    );

    // 응답 데이터를 DTO로 변환
    const responseDTO = new PurchaseProofResponseDTO(
      result.purchaseProof,
      result.thankYouMessage
    );

    res.status(201).success(responseDTO.toResponse());
  });
}

export default PurchaseProofController;