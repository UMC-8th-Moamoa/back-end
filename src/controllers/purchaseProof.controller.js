import { purchaseProofService } from '../services/purchaseProof.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { 
  PurchaseProofRequestDTO, 
  PurchaseProofResponseDTO,
  PurchaseProofGetResponseDTO 
} from '../dtos/purchaseProof.dto.js';

class PurchaseProofController {
  // 선물 구매 인증 등록
  async createPurchaseProof(req, res) {
    const userId = req.user.id;
    
    const requestDTO = new PurchaseProofRequestDTO(req.params, req.body);
    const { eventId, proofImages, message } = requestDTO.getValidatedData();

    const result = await purchaseProofService.createPurchaseProof(
      userId,
      eventId,
      {
        proofImages,
        message
      }
    );

    const responseDTO = new PurchaseProofResponseDTO(
      result.purchaseProof,
      result.thankYouMessage
    );

    res.status(201).success(responseDTO.toResponse());
  }

  // 구매 인증 조회
  async getPurchaseProof(req, res) {
    const userId = req.user.id;
    const { eventId } = req.params;

    // 이벤트 ID 검증
    const eventIdNumber = parseInt(eventId);
    if (isNaN(eventIdNumber) || eventIdNumber < 1) {
      return res.status(400).error({
        errorCode: 'VALIDATION_ERROR',
        reason: '유효한 이벤트 ID가 필요합니다'
      });
    }

    // 서비스 레이어 호출
    const result = await purchaseProofService.getPurchaseProof(userId, eventIdNumber);

    // 응답 DTO 사용
    const responseDTO = new PurchaseProofGetResponseDTO(result);

    res.success(responseDTO.toResponse());
  }
}

// 인스턴스 생성 및 catchAsync 래핑
const purchaseProofController = new PurchaseProofController();

export default {
  createPurchaseProof: catchAsync(purchaseProofController.createPurchaseProof),
  getPurchaseProof: catchAsync(purchaseProofController.getPurchaseProof)
};