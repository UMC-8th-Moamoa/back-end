import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class MypageRepository {
    async findUserByUserId(user_id) {
        const user = await prisma.user.findUnique({
            where: { user_id: user_id },
            select: {
                id: true,
                user_id: true,
                name: true,
                birthday: true,
                image: true,
                email: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (user) {
            const followersCount = await prisma.follower.count({
                where: { following_user_id: user.id }
            });
            const followingsCount = await prisma.follower.count({
                where: { follower_user_id: user.id }
            });

            user.followers_num = followersCount;
            user.following_num = followingsCount;
        }

        return user;
    }
}

export default new MypageRepository();