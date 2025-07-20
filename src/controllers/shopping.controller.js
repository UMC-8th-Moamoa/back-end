import shoppingService from '../services/shoppingService.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import {
    ShoppingRequestDTO, 
    ItemListResponseDTO
} from '../dtos/shopping.dto.js';


class shoppingController{
    /**
    * 아이템 리스트를 조회
    * GET /api/shopping/item_list
    */
    static getShoppingItems = catchAsync(async (req, res) => {
        const Item = new ShoppingRequestDTO(req.query);
        const { category, num } = Item.getValidatedData();
        const items = await shoppingService.getShoppingItems({ category, num });
        const responseDTO = new ItemListResponseDTO(items);
        res.success(responseDTO.toResponse());
    })
}

export default shoppingController;