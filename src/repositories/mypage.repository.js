import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class MypageRepository {
    async findUserByUserId(user_id, includeFollowCounts = false) {
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

    async createCustomerServicePost(userId, title, content, isPrivate) {
        if (!userId) {
            console.error('❌ createCustomerServicePost called with undefined userId');
            throw new Error('userId is required');
        }

        return await prisma.customerServicePost.create({
            data: {
                user_id: userId,
                title: title,
                content: content,
                private: isPrivate,
            },
        });
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
}

export default new MypageRepository();