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
        const { category, user_id, item_no, price, event } = itemBuyRequest.getValidatedData();

        const purchaseResult = await shoppingService.buyItem({ 
            category, 
            user_id, 
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

        // JWT에서 사용자 정보 가져오기
        let user_id = req.user?.user_id; // 문자열 user_id가 있는지 체크
        
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

        const userItems = await shoppingService.getUserItemList({ user_id, num });
        const responseDTO = new UserItemResponseDTO(userItems);
        res.success(responseDTO.toResponse());
    })
}

export default shoppingController;