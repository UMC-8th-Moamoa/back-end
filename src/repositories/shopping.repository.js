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

    static findUserItemsByUserId = async (user_id, num) => {
        try {
            const user = await prisma.user.findUnique({
                where: { user_id: user_id }
            });
    
            if (!user) {
                return [];
            }
    
            // Raw SQL로 조회 (더 명확한 컬럼명 지정)
            let query = `
                SELECT 
                    ui.id as holditem_no,
                    ui.userId,
                    ui.itemId,
                    ui.purchasedAt,
                    i.id as item_id,
                    i.category as item_category,
                    i.name as item_name,
                    i.price as item_price,
                    i.imageUrl as item_image,
                    i.description as item_description,
                    i.event as item_event
                FROM user_items ui
                INNER JOIN items i ON ui.itemId = i.id
                WHERE ui.userId = ${user.id}
                ORDER BY ui.purchasedAt DESC
            `;
            
            if (num) {
                query += ` LIMIT ${parseInt(num, 10)}`;
            }
    
            const userItems = await prisma.$queryRawUnsafe(query);
    
            // 데이터 확인을 위한 임시 로그 (문제 해결 후 제거)
            if (userItems.length > 0) {
                console.log('🔍 Raw 데이터 확인:', {
                    item_name: userItems[0].item_name,
                    item_description: userItems[0].item_description,
                    item_category: userItems[0].item_category
                });
            }
    
            // 데이터 형변환 및 매핑
            const mappedItems = userItems.map(userItem => ({
                holditem_no: typeof userItem.holditem_no === 'bigint' 
                    ? Number(userItem.holditem_no) 
                    : userItem.holditem_no,
                category: userItem.item_category,
                item_no: typeof userItem.item_id === 'bigint' 
                    ? Number(userItem.item_id) 
                    : userItem.item_id,
                name: userItem.item_name || '이름 없음',
                price: typeof userItem.item_price === 'bigint' 
                    ? Number(userItem.item_price) 
                    : userItem.item_price,
                user_id: user.user_id,
                image: userItem.item_image,
                detail: userItem.item_description || '',
                event: Boolean(userItem.item_event),
                purchasedAt: userItem.purchasedAt
            }));
    
            return mappedItems;
    
        } catch (error) {
            // 기존 ORM 방식으로 폴백 시도
            try {
                const user = await prisma.user.findUnique({
                    where: { user_id: user_id }
                });
    
                if (!user) return [];
                
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
                    name: userItem.item.name,
                    price: userItem.item.price,
                    user_id: user.user_id,
                    image: userItem.item.imageUrl,
                    detail: userItem.item.description || '',
                    event: userItem.item.event,
                    purchasedAt: userItem.purchasedAt
                }));
    
            } catch (ormError) {
                throw error;
            }
        }
    };
    
    // findUserItemsByUserIdNumber 메서드도 동일하게 이름 포함
    static findUserItemsByUserIdNumber = async (userId, num) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, user_id: true }
            });
    
            if (!user) {
                return [];
            }
    
            // Raw SQL로 조회 (명확한 컬럼명 지정)
            let query = `
                SELECT 
                    ui.id as holditem_no,
                    ui.userId,
                    ui.itemId,
                    ui.purchasedAt,
                    i.id as item_id,
                    i.category as item_category,
                    i.name as item_name,
                    i.price as item_price,
                    i.imageUrl as item_image,
                    i.description as item_description,
                    i.event as item_event
                FROM user_items ui
                INNER JOIN items i ON ui.itemId = i.id
                WHERE ui.userId = ${userId}
                ORDER BY ui.purchasedAt DESC
            `;
            
            if (num) {
                query += ` LIMIT ${parseInt(num, 10)}`;
            }
    
            const userItems = await prisma.$queryRawUnsafe(query);
    
            return userItems.map(userItem => ({
                holditem_no: typeof userItem.holditem_no === 'bigint' 
                    ? Number(userItem.holditem_no) 
                    : userItem.holditem_no,
                category: userItem.item_category,
                item_no: typeof userItem.item_id === 'bigint' 
                    ? Number(userItem.item_id) 
                    : userItem.item_id,
                name: userItem.item_name || '이름 없음',
                price: typeof userItem.item_price === 'bigint' 
                    ? Number(userItem.item_price) 
                    : userItem.item_price,
                user_id: user.user_id,
                image: userItem.item_image,
                detail: userItem.item_description || '',
                event: Boolean(userItem.item_event),
                purchasedAt: userItem.purchasedAt
            }));
    
        } catch (error) {
            throw error;
        }
    };
}

export default shoppingRepository;