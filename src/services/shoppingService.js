import shoppingRepository from '../repositories/shopping.repository.js';
import { ValidationError } from '../middlewares/errorHandler.js';

class shoppingService{
/**
 * @desc 카테고리별 아이템 목록 조회
 * @param {object} options - 쿼리 데이터
 * @param {string} options.category - 카테고리 (font / paper / envelope)
 * @param {number} [options.num] - 화면에 띄울 아이템 개수
 * @returns {Promise<Array>}
 */
    static getItemList = async ({ category, num }) => {
        let items;
        items = await shoppingRepository.findItemsByCategory(category, num);
        return items;
    }

    /**
     * @desc 특정 카테고리와 ID에 해당하는 아이템 상세 정보 조회
     * @param {object} options - 쿼리 데이터
     * @param {string} options.category - 조회할 아이템 카테고리 (font / paper / envelope)
     * @param {number} options.id - 조회할 아이템의 고유 ID
     * @returns {Promise<object|null>} - 조회된 아이템 객체 또는 null
     */
    static getItemDetail = async ({ category, id }) => {
        const item = await shoppingRepository.findItemDetailByIdAndCategory(category, id);
        if (!item) {
            throw new ValidationError('Item not found with the provided category and ID.');
        }

        return item;
    }
    static buyItem = async ({ category, user_id, item_no, price, event }) => {
        const purchaseRecord = await shoppingRepository.createPurchaseRecord({
            category,
            user_id,
            item_no,
            price,
            event,
            // 추가 필드 (예: purchase_date, status 등)
        });

        // 구매 성공 메시지 반환
        return { message: "아이템 구매 성공", purchaseRecordId: purchaseRecord.id };
    }

    static getUserItemList = async ({ userId, num }) => {
        // 사용자 ID를 기반으로 구매한 아이템 목록을 리포지토리에서 조회합니다.
        const userItems = await shoppingRepository.findUserItemsByUserId(userId, num);
        return userItems;
    }
}

export default shoppingService;