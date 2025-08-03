import shoppingRepository from '../repositories/shopping.repository.js';
import { ValidationError } from '../middlewares/errorHandler.js';

class shoppingService {
    static getItemList = async ({ category, num }) => {
        const items = await shoppingRepository.findItemsByCategory(category, num);
        return items;
    }

    static getItemDetail = async ({ id }) => {
        const item = await shoppingRepository.findItemDetailById(id);
        if (!item) {
            throw new ValidationError('Item not found with the provided ID.');
        }
        return item;
    }

    static buyItem = async ({ category, user_id, item_no, price, event }) => {
        try {
            const purchaseRecord = await shoppingRepository.createPurchaseRecord({
                category,
                user_id,
                item_no,
                price,
                event,
            });

            return { 
                message: "아이템 구매 성공", 
                purchaseRecordId: purchaseRecord.id,
                remainingCash: purchaseRecord.remainingCash
            };
        } catch (error) {
            throw new ValidationError(error.message);
        }
    }

    static getUserItemList = async ({ user_id, num }) => {
        const userItems = await shoppingRepository.findUserItemsByUserId(user_id, num);
        return userItems;
    }

    // 추가: 숫자 ID로 user_id 문자열 조회
    static getUserIdStringById = async (userId) => {
        const user = await shoppingRepository.findUserByIdNumber(userId);
        return user ? user.user_id : null;
    }

    // 추가: 사용자 ID(숫자)로 아이템 목록 조회
    static getUserItemListById = async ({ userId, num }) => {
        const userItems = await shoppingRepository.findUserItemsByUserIdNumber(userId, num);
        return userItems;
    }
}

export default shoppingService;