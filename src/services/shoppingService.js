import shoppingRepository from '../repositories/shopping.repository.js';
import {ValidationError} from '../middlewares/errorHandler.js';

class shoppingService{
/**
 * @desc 카테고리별 아이템 목록 조회
 * @param {object} options - 쿼리 데이터
 * @param {enum} [object.category] - 카테고리 (font / paper / envelope)
 * @param {number} [object.num] - 화면에 띄울 아이템 개수
 * @returns  {Promise<Array>}
 */

    static getShoppingItems = async ({ category, num }) => {
        let items;
        items = await shoppingRepository.findItemsByCategory(category, num);
        return items;
    }
}

export default shoppingService;