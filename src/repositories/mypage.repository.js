import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class MypageRepository {
    async findUserById(userId, includeFollowCounts = false) {
        if (!userId) {
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                user_id: true,
                name: true,
                birthday: true,
                photo: true,
                email: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!user) {
            return null;
        }

        // includeFollowCounts가 true일 때만 팔로워/팔로잉 수 계산
        if (includeFollowCounts) {
            const followersCount = await prisma.follow.count({
                where: { followingId: user.id }
            });
            const followingsCount = await prisma.follow.count({
                where: { followerId: user.id }
            });
            
            user.followers_num = followersCount;
            user.following_num = followingsCount;
        }

        return user;
    }

    async findUserByUserId(user_id, includeFollowCounts = false) {
        console.log('🔍 MypageRepository.findUserByUserId called with:', { user_id, includeFollowCounts });
        // Add validation to prevent undefined user_id
        if (!user_id) {
            console.error('❌ findUserByUserId called with undefined/null user_id:', user_id);
            return null;
        }

        console.log('🔍 Repository: Finding user by user_id:', user_id);

        const user = await prisma.user.findUnique({
            where: { user_id: user_id },
            select: {
                id: true,
                user_id: true,
                name: true,
                birthday: true,
                photo: true,
                email: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!user) {
            console.log('❌ Repository: User not found for user_id:', user_id);
            return null;
        }

        console.log('✅ Repository: User found:', { id: user.id, user_id: user.user_id });

        // includeFollowCounts가 true일 때만 팔로워/팔로잉 수 계산
        if (includeFollowCounts) {
            const followersCount = await prisma.follow.count({
                where: { followingId: user.id }
            });
            const followingsCount = await prisma.follow.count({
                where: { followerId: user.id }
            });

            user.followers_num = followersCount;
            user.following_num = followingsCount;
        }

        return user;
    }

    async isFollowingUser(followerUserIdString, followingUserIdString) {
        console.log('🔍 Repository: isFollowingUser called with:', { 
            followerUserIdString, 
            followingUserIdString 
        });

        // Add validation to prevent undefined parameters
        if (!followerUserIdString || !followingUserIdString) {
            console.error('❌ isFollowingUser called with undefined parameters:', {
                followerUserIdString,
                followingUserIdString
            });
            return false;
        }

        const followerUser = await prisma.user.findUnique({
            where: { user_id: followerUserIdString },
            select: { id: true }
        });

        const followingUser = await prisma.user.findUnique({
            where: { user_id: followingUserIdString },
            select: { id: true }
        });

        console.log('🔍 Repository: Found users:', { 
            followerUser: followerUser?.id, 
            followingUser: followingUser?.id 
        });

        if (!followerUser || !followingUser) {
            console.log('❌ Repository: One or both users not found');
            return false;
        }

        const followRecord = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: followerUser.id,
                    followingId: followingUser.id,
                },
            },
        });

        const isFollowing = !!followRecord;
        console.log('✅ Repository: isFollowing result:', isFollowing);

        return isFollowing;
    }

    async getFollowRelationship(currentUserIdString, targetUserIdString) {
        console.log('🔍 Repository: getFollowRelationship called with:', { 
            currentUserIdString, 
            targetUserIdString 
        });

        // Add validation to prevent undefined parameters
        if (!currentUserIdString || !targetUserIdString) {
            console.error('❌ getFollowRelationship called with undefined parameters:', {
                currentUserIdString,
                targetUserIdString
            });
            return { is_following: false, is_follower: false };
        }

        const currentUser = await prisma.user.findUnique({
            where: { user_id: currentUserIdString },
            select: { id: true }
        });

        const targetUser = await prisma.user.findUnique({
            where: { user_id: targetUserIdString },
            select: { id: true }
        });

        console.log('🔍 Repository: Found users:', { 
            currentUser: currentUser?.id, 
            targetUser: targetUser?.id 
        });

        if (!currentUser || !targetUser) {
            console.log('❌ Repository: One or both users not found');
            return { is_following: false, is_follower: false };
        }

        // 내가 상대를 팔로우하는지 확인
        const followingRecord = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUser.id,
                    followingId: targetUser.id,
                },
            },
        });

        // 상대가 나를 팔로우하는지 확인
        const followerRecord = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: targetUser.id,
                    followingId: currentUser.id,
                },
            },
        });

        const result = {
            is_following: !!followingRecord,
            is_follower: !!followerRecord
        };

        console.log('✅ Repository: Follow relationship result:', result);
        return result;
    }

    async createCustomerServicePost(userId, title, content) {
        if (!userId) {
            console.error('❌ createCustomerServicePost called with undefined userId');
            throw new Error('userId is required');
        }

        return await prisma.customerServicePost.create({
            data: {
                user_id: userId,
                title: title,
                content: content,
                private: false, // 기본값으로 설정
            },
        });
    }

    async getCustomerServiceList(userId, listRequest) {
        if (!userId) {
            throw new Error('userId is required');
        }

        const [inquiries, totalCount] = await Promise.all([
            prisma.customerServicePost.findMany({
                where: { user_id: userId },
                include: {
                    responses: true
                },
                orderBy: { created_at: 'desc' },
                skip: listRequest.offset,
                take: listRequest.limit,
            }),
            prisma.customerServicePost.count({
                where: { user_id: userId }
            })
        ]);

        return { inquiries, totalCount };
    }

    async getCustomerServiceDetail(userId, inquiryId) {
        if (!userId || !inquiryId) {
            throw new Error('userId and inquiryId are required');
        }

        return await prisma.customerServicePost.findFirst({
            where: {
                id: inquiryId,
                user_id: userId
            },
            include: {
                responses: {
                    orderBy: { created_at: 'asc' }
                }
            }
        });
    }

    async findUserById(userId) {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                user_id: true,
                email: true,
                name: true
            }
        });
    }

    async changeUserIdWithTransaction(userPk, newUserId) {
        console.log('🔍 Repository: changeUserIdWithTransaction called with userPk:', userPk, 'newUserId:', newUserId);
        
        if (!userPk || !newUserId) {
            console.error('❌ changeUserIdWithTransaction called with undefined parameters:', { userPk, newUserId });
            throw new Error('userPk and newUserId are required');
        }

        return await prisma.$transaction(async (tx) => {
            // 1. 현재 사용자 존재 확인
            const currentUser = await tx.user.findUnique({
                where: { id: userPk },
                select: {
                    id: true,
                    user_id: true,
                    email: true,
                    name: true
                }
            });

            if (!currentUser) {
                const error = new Error('사용자를 찾을 수 없습니다.');
                error.statusCode = 404;
                throw error;
            }

            // 2. 새로운 ID가 현재 ID와 동일한지 확인
            if (currentUser.user_id === newUserId) {
                const error = new Error('현재 사용자 ID와 동일합니다.');
                error.statusCode = 400;
                throw error;
            }

            // 3. 새로운 ID 중복 확인
            const existingUser = await tx.user.findUnique({
                where: { user_id: newUserId }
            });

            if (existingUser) {
                const error = new Error('이미 사용 중인 사용자 ID입니다.');
                error.statusCode = 409;
                throw error;
            }

            // 4. 사용자 ID 업데이트
            const updatedUser = await tx.user.update({
                where: { id: userPk },
                data: { user_id: newUserId },
                select: {
                    id: true,
                    user_id: true,
                    name: true,
                    email: true,
                    phone: true,
                    photo: true
                }
            });

            console.log('✅ Repository: User ID successfully updated from', currentUser.user_id, 'to', newUserId);
            return updatedUser;
        });
    }

    async updateUserId(userId, newUserId) {
        console.log('🔍 Repository: updateUserId called with userId:', userId, 'newUserId:', newUserId);
        
        if (!userId || !newUserId) {
            console.error('❌ updateUserId called with undefined parameters:', { userId, newUserId });
            throw new Error('userId and newUserId are required');
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { user_id: newUserId },
            select: {
                id: true,
                user_id: true,
                name: true,
                email: true,
                phone: true,
                photo: true,
                updatedAt: true
            }
        });

        console.log('✅ Repository: User ID successfully updated:', updatedUser);
        return updatedUser;
    }

    async findFollow(followerId, followingId) {
        if (!followerId || !followingId) {
            console.error('❌ findFollow called with undefined parameters:', { followerId, followingId });
            return null;
        }

        return await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: followerId,
                    followingId: followingId,
                },
            },
        });
    }

    async requestFollow(followerId, followingId) {
        if (!followerId || !followingId) {
            console.error('❌ requestFollow called with undefined parameters:', { followerId, followingId });
            throw new Error('followerId and followingId are required');
        }

        return await prisma.follow.create({
            data: {
                followerId: followerId,
                followingId: followingId,
            },
        });
    }

    async unfollow(followerId, followingId) {
        if (!followerId || !followingId) {
            console.error('❌ unfollow called with undefined parameters:', { followerId, followingId });
            throw new Error('followerId and followingId are required');
        }

        return await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: followerId,
                    followingId: followingId,
                },
            },
        });
    }
    async updateProfileImage(userId, imageUrl) {
        console.log('🔍 Repository: updateProfileImage called with userId:', userId, 'imageUrl:', imageUrl);
        
        if (!userId || !imageUrl) {
            console.error('❌ updateProfileImage called with undefined parameters:', { userId, imageUrl });
            throw new Error('userId and imageUrl are required');
        }

        try {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { 
                    photo: imageUrl,
                    updatedAt: new Date()
                },
                select: {
                    id: true,
                    user_id: true,
                    name: true,
                    email: true,
                    photo: true,
                    updatedAt: true
                }
            });

            console.log('✅ Repository: Profile image successfully updated:', updatedUser);
            return updatedUser;
        } catch (error) {
            console.error('프로필 이미지 업데이트 중 오류 발생:', error);
            throw new Error('프로필 이미지 업데이트 중 오류가 발생했습니다');
        }
    }
}

export default new MypageRepository();