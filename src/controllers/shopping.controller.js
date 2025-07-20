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


class shoppingController{
    /**
    * 아이템 리스트를 조회
    * GET /api/shopping/item_list
    */
    static getItemList = catchAsync(async (req, res) => {
        const Item = new ShoppingRequestDTO(req.query);
        const { category, num } = Item.getValidatedData();
        const items = await shoppingService.getItemList({ category, num });
        const responseDTO = new ItemListResponseDTO(items);
        res.success(responseDTO.toResponse());
    })
    /**
     * @desc 하나의 아이템 상세 정보를 조회
     * @route GET /api/shopping/item_detail
     */
    static getItemDetail = catchAsync(async (req, res) => {
        const itemDetailRequest = new ItemDetailRequestDTO(req.query);
        const { category, id } = itemDetailRequest.getValidatedData();
        const item = await shoppingService.getItemDetail({ category, id });
        const responseDTO = new ItemDetailResponseDTO(item);
        res.success(responseDTO.toResponse());
    })
    /**
     * @desc 아이템 구매
     * @route POST /api/shopping/item_buy
     */
    static buyItem = catchAsync(async (req, res) => {
        const itemBuyRequest = new ItemBuyRequestDTO(req.body); // POST 요청은 req.body 사용
        const { category, user_id, item_no, price, event } = itemBuyRequest.getValidatedData();

        const purchaseResult = await shoppingService.buyItem({ category, user_id, item_no, price, event });

        const responseDTO = new ItemBuyResponseDTO(purchaseResult); // purchaseResult는 서비스에서 반환하는 결과
        res.success(responseDTO.toResponse());
    })

    /**
     * @desc 구매한 아이템 목록 조회 (사용자별)
     * @route GET /api/shopping/user_item
     */
    static getUserItemList = catchAsync(async (req, res) => {
        const userItemRequest = new UserItemRequestDTO(req.query);
        const { num } = userItemRequest.getValidatedData(); // num은 페이징을 위한 값

        const userId = req.user ? req.user.id : 'defaultUserId'; // 예시: 실제 사용자 ID 가져오기
        const userItems = await shoppingService.getUserItemList({ userId, num });

        const responseDTO = new UserItemResponseDTO(userItems);
        res.success(responseDTO.toResponse());
    })
}

export default shoppingController;