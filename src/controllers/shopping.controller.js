import shoppingService from '../services/shoppingService.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import {
    ShoppingRequestDTO, 
    ItemListResponseDTO,
    ItemDetailRequestDTO,
    ItemDetailResponseDTO,
    ItemBuyRequestDTO,
    ItemBuyResponseDTO,
    UserItemRequestDTO,
    UserItemResponseDTO 
} from '../dtos/shopping.dto.js';

class shoppingController {
    static getItemList = catchAsync(async (req, res) => {
        const Item = new ShoppingRequestDTO(req.query);
        const { category, num } = Item.getValidatedData();
        const items = await shoppingService.getItemList({ category, num });
        const responseDTO = new ItemListResponseDTO(items);
        res.success(responseDTO.toResponse());
    })

    static getItemDetail = catchAsync(async (req, res) => {
        const itemDetailRequest = new ItemDetailRequestDTO(req.query);
        const { id } = itemDetailRequest.getValidatedData();
        const item = await shoppingService.getItemDetail({ id });
        const responseDTO = new ItemDetailResponseDTO(item);
        res.success(responseDTO.toResponse());
    })

    static buyItem = catchAsync(async (req, res) => {
        const itemBuyRequest = new ItemBuyRequestDTO(req.body);
        const { category, user_id: requestUserId, item_no, price, event } = itemBuyRequest.getValidatedData();

        // API 스펙에서는 여전히 user_id 문자열을 받지만, 
        // 서버 내부에서는 JWT의 사용자와 동일한지 확인
        let actualUserId = req.user?.user_id || req.user?.userIdAlias;
        
        // JWT에서 문자열 user_id를 찾을 수 없으면 DB에서 조회
        if (!actualUserId && req.user?.id) {
            actualUserId = await shoppingService.getUserIdStringById(req.user.id);
        }

        // 요청된 user_id와 JWT의 user_id가 같은지 확인 (보안)
        if (requestUserId !== actualUserId) {
            return res.status(403).json({
                success: false,
                message: '본인의 계정으로만 구매할 수 있습니다.',
                debug: {
                    requestUserId,
                    actualUserId,
                    jwtUserId: req.user?.id
                }
            });
        }

        const purchaseResult = await shoppingService.buyItem({ 
            category, 
            user_id: actualUserId, 
            item_no, 
            price, 
            event 
        });

        const responseDTO = new ItemBuyResponseDTO(purchaseResult);
        res.success(responseDTO.toResponse());
    })

    static getUserItemList = catchAsync(async (req, res) => {
        const userItemRequest = new UserItemRequestDTO(req.query);
        const { num } = userItemRequest.getValidatedData();

        // JWT에서 사용자 정보 가져오기 - 다양한 방식으로 user_id 조회
        let user_id = req.user?.user_id || req.user?.userIdAlias; // 토큰의 userIdAlias 또는 DB의 user_id
        
        // 만약 문자열 user_id가 없고 숫자 id만 있다면, DB에서 user_id 조회
        if (!user_id && req.user?.id) {
            user_id = await shoppingService.getUserIdStringById(req.user.id);
            if (!user_id) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
        }
        
        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: '인증이 필요합니다.',
                debug: {
                    hasReqUser: !!req.user,
                    userKeys: req.user ? Object.keys(req.user) : null
                }
            });
        }

        // 쇼핑 API는 문자열 user_id를 사용하되, 편지 API와 같은 보관함을 보도록 수정
        // 실제로는 동일한 사용자이므로 숫자 ID를 사용하는 것이 더 효율적
        let userItems;
        if (req.user?.id) {
            // 숫자 ID가 있으면 숫자 ID로 조회 (더 효율적)
            userItems = await shoppingService.getUserItemListById({ userId: req.user.id, num });
        } else {
            // 숫자 ID가 없으면 문자열 ID로 조회 (기존 방식)
            userItems = await shoppingService.getUserItemList({ user_id, num });
        }
        
        const responseDTO = new UserItemResponseDTO(userItems);
        res.success(responseDTO.toResponse());
    })
}

export default shoppingController;