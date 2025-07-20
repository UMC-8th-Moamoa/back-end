import prisma from '../config/prismaClient.js';


class shoppingRepository {
    /**
     * @desc 카테고리별 아이템 목록 조회
     * @param {object} options - 쿼리 데이터
     * @param {string} category - 카테고리 (font / paper / envelope)
     * @param {number} [num] - 화면에 띄울 아이템 개수
     * @returns  {Promise<Array>}
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
}
export default shoppingRepository;