import prisma from '../config/prismaClient.js';

class shoppingRepository {
    static findItemsByCategory = async(category, num) => {
        const items = await prisma.item.findMany({
            where: {
                category: category,
            },
            take: num ? parseInt(num, 10) : undefined,
        });
        return items;
    };

    static findItemDetailByIdAndCategory = async (category, id) => {
        const item = await prisma.item.findUnique({
            where: {
                id: id,
            },
        });
        
        if (item && item.category !== category) {
            return null;
        }
        
        return item;
    };

    static findUserByUserId = async (user_id) => {
        return await prisma.user.findUnique({
            where: { user_id: user_id }
        });
    };

    static findItemById = async (item_id) => {
        return await prisma.item.findUnique({
            where: { id: item_id }
        });
    };

    static createPointHistory = async (userId, pointChange, description, totalPoints) => {
        return await prisma.pointHistory.create({
            data: {
                userId: userId,
                pointType: 'ITEM_PURCHASE',
                pointChange: pointChange,
                description: description,
                totalPoints: totalPoints
            }
        });
    };

    static createPurchaseRecord = async ({ category, user_id, item_no, price, event }) => {
        return await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { user_id: user_id }
            });
            
            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            const item = await tx.item.findUnique({
                where: { id: item_no }
            });
            
            if (!item) {
                throw new Error('아이템을 찾을 수 없습니다.');
            }

            if (item.category !== category) {
                throw new Error('아이템 카테고리가 일치하지 않습니다.');
            }

            if (user.cash < price) {
                throw new Error('캐시가 부족합니다.');
            }

            const newCash = user.cash - price;

            await tx.user.update({
                where: { id: user.id },
                data: { cash: newCash }
            });

            const pointHistory = await tx.pointHistory.create({
                data: {
                    userId: user.id,
                    pointType: 'ITEM_PURCHASE',
                    pointChange: -price,
                    description: `${item.name} 구매`,
                    totalPoints: newCash
                }
            });

            const userItem = await tx.userItem.create({
                data: {
                    userId: user.id,
                    itemId: item.id,
                    pointHistoryId: pointHistory.id
                }
            });

            return {
                id: userItem.id,
                category: item.category,
                item_no: item.id,
                user_id: user.user_id,
                price: price,
                remainingCash: newCash
            };
        });
    };

    // 기존: user_id 문자열로 조회
    static findUserItemsByUserId = async (user_id, num) => {
        const user = await prisma.user.findUnique({
            where: { user_id: user_id }
        });

        if (!user) {
            return [];
        }

        const userItems = await prisma.userItem.findMany({
            where: {
                userId: user.id,
            },
            include: {
                item: true
            },
            take: num ? parseInt(num, 10) : undefined,
            orderBy: {
                purchasedAt: 'desc',
            },
        });

        return userItems.map(userItem => ({
            holditem_no: userItem.id,
            category: userItem.item.category,
            item_no: userItem.item.id,
            user_id: user.user_id,
            image: userItem.item.imageUrl
        }));
    };

    static findUserByIdNumber = async (userId) => {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, user_id: true }
        });
    };

    // 추가: 숫자 ID로 직접 조회
    static findUserItemsByUserIdNumber = async (userId, num) => {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, user_id: true }
        });

        if (!user) {
            return [];
        }

        const userItems = await prisma.userItem.findMany({
            where: {
                userId: userId,
            },
            include: {
                item: true
            },
            take: num ? parseInt(num, 10) : undefined,
            orderBy: {
                purchasedAt: 'desc',
            },
        });

        return userItems.map(userItem => ({
            holditem_no: userItem.id,
            category: userItem.item.category,
            item_no: userItem.item.id,
            user_id: user.user_id,
            image: userItem.item.imageUrl
        }));
    };
}

export default shoppingRepository;