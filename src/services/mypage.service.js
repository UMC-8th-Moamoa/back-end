import mypageRepository from '../repositories/mypage.repository.js';
import { 
    MyInfoListDTO,
    MyInfoChangeDTO,
    OtherInfoDTO
} from '../dtos/mypage.dto.js';

class MypageService {
    async getMyInfo(userIdFromToken) {
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
        const targetUserInfo = await mypageRepository.findUserByUserId(targetUserId, true);

        if (!targetUserInfo) {
            const error = new Error('다른 사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const isFollowing = await mypageRepository.isFollowingUser(currentUserId, targetUserId);

        const formattedOtherInfo = new OtherInfoDTO({
            user_id: targetUserInfo.user_id,
            name: targetUserInfo.name,
            birthday: targetUserInfo.birthday,
            followers_num: targetUserInfo.followers_num,
            following_num: targetUserInfo.following_num,
            is_following: isFollowing,
            photo: targetUserInfo.photo
        });

        return formattedOtherInfo;
    }
    async chooseKeyword(userIdFromToken, keywords) {
        const updatedUser = await mypageRepository.updateUserKeywords(userIdFromToken, keywords);

        if (!updatedUser) {
            const error = new Error('키워드를 업데이트할 사용자 정보를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        } 

        return updatedUser.keywords;
    }
    async blockUser(blockerUserId, blockedUserId, reason) {
        const blocker = await mypageRepository.findUserByUserId(blockerUserId, false);
        const blocked = await mypageRepository.findUserByUserId(blockedUserId, false);

        if (!blocker) {
            const error = new Error('차단을 요청하는 사용자 ID를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }
        if (!blocked) {
            const error = new Error('차단할 대상 사용자 ID를 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        const existingBlock = await mypageRepository.findBlock(blocker.id, blocked.id);
        if (existingBlock) {
            const error = new Error('이미 차단된 사용자입니다.');
            error.statusCode = 409; // Conflict
            throw error;
        }

        const blockedRecord = await mypageRepository.blockUser(blocker.id, blocked.id, reason);

        return {
            blocker_user_id: blockerUserId,
            blocked_user_id: blockedUserId,
            reason: blockedRecord.reason,
            createdAt: blockedRecord.createdAt
        };
    }
    
    async createCustomerServicePost(userId, title, content, isPrivate) {
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