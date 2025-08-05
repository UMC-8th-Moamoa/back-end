import mypageRepository from '../repositories/mypage.repository.js';
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
    
    async createCustomerServicePost(userId, title, content, isPrivate) {
        if (!userId) {
            const error = new Error('사용자 ID가 제공되지 않았습니다.');
            error.statusCode = 400;
            throw error;
        }

        const user = await mypageRepository.findUserByUserId(userId, false);
        if (!user) {
            const error = new Error('사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const newPost = await mypageRepository.createCustomerServicePost(user.id, title, content, isPrivate);

        return {
            user_id: userId,
            title: newPost.title,
            content: newPost.content,
            private: newPost.private,
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