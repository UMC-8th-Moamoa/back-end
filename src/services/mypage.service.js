import mypageRepository from '../repositories/mypage.repository.js';
import { toKSTISOString } from '../utils/datetime.util.js';
import { 
    MyInfoListDTO,
    MyInfoChangeDTO,
    OtherInfoDTO
} from '../dtos/mypage.dto.js';

class MypageService {
    async getMyInfo(userIdFromToken) {
        console.log('🔍 Service: getMyInfo called with userIdFromToken:', userIdFromToken);
        
        if (!userIdFromToken) {
            console.error('❌ Service: userIdFromToken is undefined/null');
            const error = new Error('사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        const userInfo = await mypageRepository.findUserByUserId(userIdFromToken, true);

        if (!userInfo) {
            const error = new Error('사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const formattedMyInfo = new MyInfoListDTO({
            user_id: userInfo.user_id,
            name: userInfo.name,
            birthday: userInfo.birthday,
            followers_num: userInfo.followers_num,
            following_num: userInfo.following_num,
            photo: userInfo.photo
        });

        return formattedMyInfo;
    }

    async getMyInfoChange(userIdFromToken) {
        console.log('🔍 Service: getMyInfoChange called with userIdFromToken:', userIdFromToken);
        
        if (!userIdFromToken) {
            console.error('❌ Service: userIdFromToken is undefined/null');
            const error = new Error('사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        const userInfo = await mypageRepository.findUserByUserId(userIdFromToken, false);

        if (!userInfo) {
            const error = new Error('수정할 사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const formattedMyInfoChange = new MyInfoChangeDTO({
            user_id: userInfo.user_id,
            name: userInfo.name,
            birthday: userInfo.birthday,
            email: userInfo.email,
            phone: userInfo.phone,
            photo: userInfo.photo
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
        
        // Get both following relationships
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

    async changeUserId(currentUserId, newUserId) {
        console.log('🔍 Service: changeUserId called with currentUserId:', currentUserId, 'newUserId:', newUserId);
        
        if (!currentUserId) {
            console.error('❌ Service: currentUserId is undefined/null');
            const error = new Error('현재 사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        if (!newUserId) {
            console.error('❌ Service: newUserId is undefined/null');
            const error = new Error('새로운 사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        // 현재 사용자 정보 조회
        const currentUser = await mypageRepository.findUserByUserId(currentUserId, false);
        if (!currentUser) {
            const error = new Error('현재 사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        // 새로운 ID가 현재 ID와 동일한지 확인
        if (currentUserId === newUserId) {
            const error = new Error('현재 사용자 ID와 동일합니다.');
            error.statusCode = 400;
            throw error;
        }

        // 새로운 ID 중복 확인
        const existingUser = await mypageRepository.findUserByUserId(newUserId, false);
        if (existingUser) {
            const error = new Error('이미 사용 중인 사용자 ID입니다.');
            error.statusCode = 409;
            throw error;
        }

        // 사용자 ID 업데이트
        const updatedUser = await mypageRepository.updateUserId(currentUser.id, newUserId);
        
        console.log('✅ Service: User ID successfully updated from', currentUserId, 'to', newUserId);

        return {
            user_id: updatedUser.user_id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            photo: updatedUser.photo
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
        }

        return {
            follower_user_id: followerUserId,
            following_user_id: followingUserId,
            isFollowing: isFollowing
        };
    }
}

export default new MypageService();