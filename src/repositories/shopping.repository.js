import prisma from '../config/prismaClient.js';


class shoppingRepository {
    /**
     * @desc 카테고리별 아이템 목록 조회
     * @param {string} category - 카테고리 (font / paper / envelope)
     * @param {number} [num] - 화면에 띄울 아이템 개수
     * @returns {Promise<Array>}
     */
    static findItemsByCategory = async(category, num) => {
        const items = await prisma.item.findMany({
            where: {
                category: category,
            },
            take: num ? parseInt(num, 10) : undefined,
        });
        return items;
    };

    /**
     * @desc 특정 카테고리와 ID에 해당하는 아이템 상세 정보 조회
     * @param {string} category - 조회할 아이템 카테고리 (font / paper / envelope)
     * @param {number} id - 조회할 아이템의 고유 ID
     * @returns {Promise<object|null>} - 조회된 아이템 객체 또는 null
     */
    static findItemDetailByIdAndCategory = async (category, id) => {
        const item = await prisma.item.findUnique({
            where: {
                id: id,
                category: category,
            },
        });
        return item;
    };
    /**
     * @desc 새로운 구매 기록을 데이터베이스에 생성
     * @param {object} purchaseData - 구매 기록에 필요한 데이터
     * @param {string} purchaseData.category - 아이템 카테고리
     * @param {string} purchaseData.user_id - 사용자 ID
     * @param {number} purchaseData.item_no - 아이템 번호
     * @param {number} purchaseData.price - 가격
     * @param {boolean} purchaseData.event - 이벤트 여부
     * @returns {Promise<object>} - 생성된 구매 기록 객체
     */
    static createPurchaseRecord = async ({ category, user_id, item_no, price, event }) => {
        // Prisma를 사용하여 'Purchase' 또는 'HoldItem' 모델에 새 레코드를 생성합니다.
        // 모델 이름은 여러분의 schema.prisma에 정의된 실제 이름으로 바꿔주세요.
        // 여기서는 'HoldItem' 모델이 있다고 가정합니다.
        const newPurchase = await prisma.holdItem.create({
            data: {
                category: category,
                userId: user_id, // Prisma 필드명에 따라 userId 또는 user_id
                itemNo: item_no, // Prisma 필드명에 따라 itemNo 또는 item_no
                price: price,
                event: event,
                // image: 'default_image_url', // 필요하다면 이미지 URL도 저장
                // purchaseDate: new Date(), // 구매 날짜 추가
            },
        });
        return newPurchase;
    };

    /**
     * @desc 특정 사용자가 구매한 아이템 목록을 데이터베이스에서 조회
     * @param {string} userId - 조회할 사용자 ID
     * @param {number} [num] - 화면에 띄울 아이템 개수 (페이징)
     * @returns {Promise<Array>} - 구매한 아이템 배열
     */
    static findUserItemsByUserId = async (userId, num) => {
        // Prisma를 사용하여 'HoldItem' 모델에서 특정 사용자의 아이템을 조회합니다.
        const userItems = await prisma.holdItem.findMany({
            where: {
                userId: userId, // Prisma 필드명에 따라 userId 또는 user_id
            },
            take: num ? parseInt(num, 10) : undefined,
            // 정렬 기준 (예: 최신 구매 순)
            orderBy: {
                purchaseDate: 'desc', // 'purchaseDate' 필드가 있다고 가정
            },
            // 필요한 필드만 선택적으로 조회 (DTO에 맞춰)
            // select: {
            //     holditem_no: true,
            //     category: true,
            //     itemNo: true, // 또는 item_no
            //     userId: true, // 또는 user_id
            //     image: true,
            // },
        });
        return userItems;
    };
    
}
export default shoppingRepository;