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

    /**
     * @desc IDë¡œ ì•„ì´í…œ ìƒì„¸ ì •ë³´ ì¡°íšŒ (ê°„ì†Œí™"ëœ ë²„ì „)
     */
    static findItemDetailById = async (id) => {
        const item = await prisma.item.findUnique({
            where: {
                id: id,
            },
        });
        return item;
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
                throw new Error('ì‚¬ìš©ìžë¥¼ ì°¾ì„ ìˆ˜ ì—†ìŠµë‹ˆë‹¤.');
            }

            const item = await tx.item.findUnique({
                where: { id: item_no }
            });
            
            if (!item) {
                throw new Error('ì•„ì´í…œì„ ì°¾ì„ ìˆ˜ ì—†ìŠµë‹ˆë‹¤.');
            }

            if (item.category !== category) {
                throw new Error('ì•„ì´í…œ ì¹´í…Œê³ ë¦¬ê°€ ì¼ì¹˜í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤.');
            }

            if (user.cash < price) {
                throw new Error('ìºì‹œê°€ ë¶€ì¡±í•©ë‹ˆë‹¤.');
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
                    description: `${item.name} êµ¬ë§¤`,
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

    // ê¸°ì¡´: user_id ë¬¸ìžì—´ë¡œ ì¡°íšŒ
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

    // ì¶"ê°€: ìˆ«ìž IDë¡œ ì§ì ' ì¡°íšŒ
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