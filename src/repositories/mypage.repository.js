import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class MypageRepository {
    async findUserByUserId(user_id, includeFollowCounts = false) {
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
    async isFollowingUser(followerUserIdString, followingUserIdString) {
        const followerUser = await prisma.user.findUnique({
            where: { user_id: followerUserIdString },
            select: { id: true }
        });

        const followingUser = await prisma.user.findUnique({
            where: { user_id: followingUserIdString },
            select: { id: true }
        });

        if (!followerUser || !followingUser) {
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

        return !!followRecord;
    }
    async updateUserKeywords(user_id, keywords) {
        const user = await prisma.user.update({
            where: { user_id: user_id },
            data: {
                keywords: keywords,
            },
            select: {
                user_id: true,
                keywords: true,
            },
        });
        return user;
    }

    async findBlock(blockerId, blockedId) {
        return await prisma.blockedUser.findUnique({
            where: {
                blocker_id_blocked_id: {
                    blocker_id: blockerId,
                    blocked_id: blockedId,
                },
            },
        });
    }

    async blockUser(blockerId, blockedId, reason) {
        return await prisma.blockedUser.create({
            data: {
                blocker_id: blockerId,
                blocked_id: blockedId,
                reason: reason,
            },
        });
    }

    async createCustomerServicePost(userId, title, content, isPrivate) {
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
        return await prisma.follow.create({
            data: {
                followerId: followerId,
                followingId: followingId,
            },
        });
    }

    async unfollow(followerId, followingId) {
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