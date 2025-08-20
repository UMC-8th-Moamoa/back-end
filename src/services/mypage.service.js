import mypageRepository from '../repositories/mypage.repository.js';
import { PrismaClient } from '@prisma/client';
import { toKSTISOString } from '../utils/datetime.util.js';

const prisma = new PrismaClient();
import { 
    MyInfoListDTO,
    MyInfoChangeDTO,
    OtherInfoDTO
} from '../dtos/mypage.dto.js';

class MypageService {
    constructor() {
        this.mypageRepository = mypageRepository;
    }

    async getMyInfo(userPk) {
        if (!userPk) {
            const error = new Error('사용자 PK가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        const user = await prisma.user.findUnique({
            where: { id: userPk },
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
            const error = new Error('사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const followersCount = await prisma.follow.count({
            where: { followingId: user.id }
        });
        const followingsCount = await prisma.follow.count({
            where: { followerId: user.id }
        });

        user.followers_num = followersCount;
        user.following_num = followingsCount;

        const formattedMyInfo = new MyInfoListDTO({
            user_id: user.user_id,
            name: user.name,
            birthday: user.birthday,
            followers_num: user.followers_num,
            following_num: user.following_num,
            photo: user.photo
        });

        return formattedMyInfo;
    }

    async getMyInfoChange(userPk) {
        if (!userPk) {
            const error = new Error('사용자 PK가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        const user = await prisma.user.findUnique({
            where: { id: userPk },
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
            const error = new Error('수정할 사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const formattedMyInfoChange = new MyInfoChangeDTO({
            user_id: user.user_id,
            name: user.name,
            birthday: user.birthday,
            email: user.email,
            phone: user.phone,
            photo: user.photo
        });

        return formattedMyInfoChange;
    }

    async getOtherUserInfo(targetUserId, currentUserId) {
        console.log('=== DEBUG: Service getOtherUserInfo ===');
        console.log('targetUserId:', targetUserId);
        console.log('currentUserId:', currentUserId);
        
        if (!targetUserId) {
            console.error('❌ Service: targetUserId is undefined/null');
            const error = new Error('대상 사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        if (!currentUserId) {
            console.error('❌ Service: currentUserId is undefined/null');
            const error = new Error('현재 사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        const targetUserInfo = await mypageRepository.findUserByUserId(targetUserId, true);
        console.log('✅ Service: Repository result:', targetUserInfo);

        if (!targetUserInfo) {
            const error = new Error('다른 사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        console.log('🔍 Service: Checking follow relationship - currentUserId:', currentUserId, 'targetUserId:', targetUserId);
        
        let followRelationship = { is_following: false, is_follower: false };
        if (currentUserId && targetUserId) {
            followRelationship = await mypageRepository.getFollowRelationship(currentUserId, targetUserId);
            console.log('✅ Service: Follow relationship result:', followRelationship);
        }

        const formattedOtherInfo = new OtherInfoDTO({
            user_id: targetUserInfo.user_id,
            name: targetUserInfo.name,
            birthday: targetUserInfo.birthday,
            followers_num: targetUserInfo.followers_num,
            following_num: targetUserInfo.following_num,
            is_following: followRelationship.is_following,
            is_follower: followRelationship.is_follower,
            photo: targetUserInfo.photo
        });

        console.log('✅ Service: Final formatted result:', formattedOtherInfo);
        return formattedOtherInfo;
    }
    
    async createCustomerServicePost(userId, userIdString, title, content) {
        if (!userId) {
            const error = new Error('사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        const user = await mypageRepository.findUserById(userId);
        if (!user) {
            const error = new Error('사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const newPost = await mypageRepository.createCustomerServicePost(userId, title, content);

        return {
            id: newPost.id,
            title: newPost.title,
            content: newPost.content,
            userId: userIdString,
            createdAt: toKSTISOString(newPost.created_at)
        };
    }

    async getCustomerServiceList(userId, listRequest) {
        if (!userId) {
            const error = new Error('사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        const user = await mypageRepository.findUserById(userId);
        if (!user) {
            const error = new Error('사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const { inquiries, totalCount } = await mypageRepository.getCustomerServiceList(userId, listRequest);

        const totalPages = Math.ceil(totalCount / listRequest.limit);

        return {
            inquiries: inquiries.map(inquiry => ({
                id: inquiry.id,
                title: inquiry.title,
                content: inquiry.content,
                userId: user.user_id,
                createdAt: toKSTISOString(inquiry.created_at),
                hasResponse: inquiry.responses && inquiry.responses.length > 0,
                responseStatus: inquiry.responses && inquiry.responses.length > 0 ? "답변 보기" : "답변 대기"
            })),
            pagination: {
                currentPage: listRequest.page,
                totalPages,
                totalCount,
                hasNext: listRequest.page < totalPages,
                hasPrev: listRequest.page > 1,
                limit: listRequest.limit
            }
        };
    }

    async getCustomerServiceDetail(userId, inquiryId) {
        if (!userId) {
            const error = new Error('사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        const user = await mypageRepository.findUserById(userId);
        if (!user) {
            const error = new Error('사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const inquiry = await mypageRepository.getCustomerServiceDetail(userId, inquiryId);
        if (!inquiry) {
            const error = new Error('문의를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        return {
            inquiry: {
                id: inquiry.id,
                title: inquiry.title,
                content: inquiry.content,
                userId: user.user_id,
                createdAt: toKSTISOString(inquiry.created_at),
                hasResponse: inquiry.responses && inquiry.responses.length > 0
            },
            responses: inquiry.responses ? inquiry.responses.map(response => ({
                id: response.id,
                content: response.content,
                isAdminResponse: response.is_admin_response,
                adminName: response.admin_name || "고객지원팀",
                createdAt: toKSTISOString(response.created_at)
            })) : []
        };
    }

    async changeUserId(userPk, newUserId) {
        console.log('🔍 Service: changeUserId called with userPk:', userPk, 'newUserId:', newUserId);
        
        if (!userPk) {
            console.error('❌ Service: userPk is undefined/null');
            const error = new Error('사용자 PK가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        if (!newUserId) {
            console.error('❌ Service: newUserId is undefined/null');
            const error = new Error('새로운 사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        const result = await mypageRepository.changeUserIdWithTransaction(userPk, newUserId);
        
        console.log('✅ Service: User ID successfully updated to', newUserId);

        return {
            user: {
                id: result.id,
                user_id: result.user_id,
                name: result.name,
                email: result.email,
                phone: result.phone,
                photo: result.photo
            }
        };
    }

    async requestFollow(followerUserId, followingUserId) {
        if (!followerUserId || !followingUserId) {
            const error = new Error('팔로워 및 팔로잉 사용자 ID가 모두 필요합니다.');
            error.statusCode = 400;
            throw error;
        }

        const follower = await mypageRepository.findUserByUserId(followerUserId, false);
        const following = await mypageRepository.findUserByUserId(followingUserId, false);

        if (!follower || !following) {
            const error = new Error('팔로우 요청 사용자 또는 대상 사용자 ID를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const existingFollow = await mypageRepository.findFollow(follower.id, following.id);

        let isFollowing = false;

        if (existingFollow) {
            await mypageRepository.unfollow(follower.id, following.id);
            isFollowing = false;
        } else {
            await mypageRepository.requestFollow(follower.id, following.id);
            isFollowing = true;

            // 팔로우가 성립된 경우: 팔로우 대상의 active 생일 이벤트가 있으면 알림 생성
            const prisma = (await import('../config/prismaClient.js')).default;
            const { notificationService } = await import('./notification.service.js');

            // 1. 팔로우 당한 사용자에게 "[팔로워]님이 회원님을 팔로우하기 시작했습니다" 알림
            await notificationService.createNotificationWithAllParams(
                following.id,
                'FOLLOWED',
                '새 팔로워',
                `${follower.name}님이 회원님을 팔로우하기 시작했습니다.`
            );

            // 2. 팔로우 대상의 active 생일 이벤트가 있으면 팔로워에게 알림
            const activeEvent = await prisma.birthdayEvent.findFirst({
                where: {
                    birthdayPersonId: following.id,
                    status: 'active',
                    deadline: { gte: new Date() }
                }
            });
            if (activeEvent) {
                await notificationService.createFriendEventCreatedToFollowers([
                    { id: follower.id }
                ], following.name);
            }
        }

        return {
            follower_user_id: followerUserId,
            following_user_id: followingUserId,
            isFollowing: isFollowing
        };
    }

    async getFollowersList(userPk, page = 1, limit = 20) {
        if (!userPk) {
            const error = new Error('사용자 PK가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }
    
        const user = await prisma.user.findUnique({
            where: { id: userPk },
            select: { id: true, user_id: true }
        });
    
        if (!user) {
            const error = new Error('사용자를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }
    
        const offset = (page - 1) * limit;
    
        const [followers, totalCount] = await Promise.all([
            prisma.follow.findMany({
                where: { followingId: user.id },
                include: {
                    follower: {
                        select: {
                            id: true,
                            user_id: true,
                            name: true,
                            photo: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit
            }),
            prisma.follow.count({
                where: { followingId: user.id }
            })
        ]);
    
        const followersWithStatus = await Promise.all(
            followers.map(async (follow) => {
                const followRelationship = await mypageRepository.getFollowRelationship(
                    user.user_id, 
                    follow.follower.user_id
                );
    
                return {
                    user_id: follow.follower.user_id,
                    name: follow.follower.name,
                    photo: follow.follower.photo,
                    followed_at: toKSTISOString(follow.createdAt),
                    is_following: followRelationship.is_following,
                    is_mutual: followRelationship.is_following
                };
            })
        );
    
        return {
            followers: followersWithStatus,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasNext: page < Math.ceil(totalCount / limit),
                hasPrev: page > 1,
                limit
            }
        };
    }
    
    async getFollowingsList(userPk, page = 1, limit = 20) {
        if (!userPk) {
            const error = new Error('사용자 PK가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }
    
        const user = await prisma.user.findUnique({
            where: { id: userPk },
            select: { id: true, user_id: true }
        });
    
        if (!user) {
            const error = new Error('사용자를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }
    
        const offset = (page - 1) * limit;
    
        const [followings, totalCount] = await Promise.all([
            prisma.follow.findMany({
                where: { followerId: user.id },
                include: {
                    following: {
                        select: {
                            id: true,
                            user_id: true,
                            name: true,
                            photo: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit
            }),
            prisma.follow.count({
                where: { followerId: user.id }
            })
        ]);
    
        const followingsWithStatus = await Promise.all(
            followings.map(async (follow) => {
                const followRelationship = await mypageRepository.getFollowRelationship(
                    user.user_id, 
                    follow.following.user_id
                );
    
                return {
                    user_id: follow.following.user_id,
                    name: follow.following.name,
                    photo: follow.following.photo,
                    followed_at: toKSTISOString(follow.createdAt),
                    is_follower: followRelationship.is_follower,
                    is_mutual: followRelationship.is_follower
                };
            })
        );
    
        return {
            followings: followingsWithStatus,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasNext: page < Math.ceil(totalCount / limit),
                hasPrev: page > 1,
                limit
            }
        };
    }

    async unfollowUser(currentUserId, targetUserId) {
        console.log('🔍 Service: unfollowUser called with currentUserId:', currentUserId, 'targetUserId:', targetUserId);
        
        if (!currentUserId || !targetUserId) {
            const error = new Error('현재 사용자 ID와 대상 사용자 ID가 모두 필요합니다.');
            error.statusCode = 400;
            throw error;
        }

        if (currentUserId === targetUserId) {
            const error = new Error('자기 자신을 언팔로우할 수 없습니다.');
            error.statusCode = 400;
            throw error;
        }

        const currentUser = await mypageRepository.findUserByUserId(currentUserId, false);
        const targetUser = await mypageRepository.findUserByUserId(targetUserId, false);

        if (!currentUser || !targetUser) {
            const error = new Error('사용자를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const existingFollow = await mypageRepository.findFollow(currentUser.id, targetUser.id);
        
        if (!existingFollow) {
            const error = new Error('팔로우하지 않은 사용자입니다.');
            error.statusCode = 400;
            throw error;
        }

        await mypageRepository.unfollow(currentUser.id, targetUser.id);

        console.log('✅ Service: Successfully unfollowed user');

        return {
            current_user_id: currentUserId,
            target_user_id: targetUserId,
            isFollowing: false,
            message: '팔로우가 취소되었습니다.'
        };
    }

    async removeFollower(currentUserId, followerUserId) {
        console.log('🔍 Service: removeFollower called with currentUserId:', currentUserId, 'followerUserId:', followerUserId);
        
        if (!currentUserId || !followerUserId) {
            const error = new Error('현재 사용자 ID와 팔로워 사용자 ID가 모두 필요합니다.');
            error.statusCode = 400;
            throw error;
        }

        if (currentUserId === followerUserId) {
            const error = new Error('자기 자신을 팔로워에서 제거할 수 없습니다.');
            error.statusCode = 400;
            throw error;
        }

        const currentUser = await mypageRepository.findUserByUserId(currentUserId, false);
        const followerUser = await mypageRepository.findUserByUserId(followerUserId, false);

        if (!currentUser || !followerUser) {
            const error = new Error('사용자를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const existingFollow = await mypageRepository.findFollow(followerUser.id, currentUser.id);
        
        if (!existingFollow) {
            const error = new Error('해당 사용자가 나를 팔로우하지 않습니다.');
            error.statusCode = 400;
            throw error;
        }

        await mypageRepository.unfollow(followerUser.id, currentUser.id);

        console.log('✅ Service: Successfully removed follower');

        return {
            current_user_id: currentUserId,
            removed_follower_id: followerUserId,
            isFollower: false,
            message: '팔로워가 제거되었습니다.'
        };
    }
    
    async updateProfileImage(userPk, imageUrl) {
        console.log('🔍 Service: updateProfileImage called with userPk:', userPk, 'imageUrl:', imageUrl);
        
        if (!userPk) {
            console.error('❌ Service: userPk is undefined/null');
            const error = new Error('사용자 PK가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        if (!imageUrl) {
            console.error('❌ Service: imageUrl is undefined/null');
            const error = new Error('이미지 URL이 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        try {
            // 사용자 존재 확인
            const user = await mypageRepository.findUserById(userPk);
            if (!user) {
                const error = new Error('사용자를 찾을 수 없습니다.');
                error.statusCode = 404;
                throw error;
            }

            // 프로필 이미지 업데이트
            const updatedUser = await mypageRepository.updateProfileImage(userPk, imageUrl);

            console.log('✅ Service: Profile image successfully updated');

            return {
                imageUrl: updatedUser.photo,
                message: '프로필 이미지가 성공적으로 변경되었습니다.'
            };
        } catch (error) {
            console.error('프로필 이미지 업데이트 서비스 오류:', error);
            throw error;
        }
    }
}

export default new MypageService();