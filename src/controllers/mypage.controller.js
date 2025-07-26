import { catchAsync } from '../middlewares/errorHandler.js';
import mypageService from '../services/mypage.service.js';
import prisma from '../config/prismaClient.js';
import { 
    MyInfoRequestDTO,
    ChooseKeywordRequestDTO,
    BlockUserRequestDTO
} from '../dtos/mypage.dto.js';

class mypageController {
    static getMyInfoList = catchAsync(async (req, res) => {
        const myInfoRequest = new MyInfoRequestDTO(req.query);
        const { user_id: requestedUserId } = myInfoRequest;

        const currentUser = req.user; 

        // 현재 사용자의 완전한 정보를 데이터베이스에서 조회
        const fullUserInfo = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: {
                id: true,
                user_id: true,
                email: true,
                name: true
            }
        });

        if (!fullUserInfo || fullUserInfo.user_id !== requestedUserId) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다. 본인의 정보만 조회할 수 있습니다.'
            });
        }

        const myInfo = await mypageService.getMyInfo(fullUserInfo.user_id);

        res.status(200).json({
            success: true,
            MyInfo: myInfo
        });
    });

    static getMyInfoChangeList = catchAsync(async (req, res) => {
        const myInfoChangeRequest = new MyInfoRequestDTO(req.query);
        const { user_id: requestedUserId } = myInfoChangeRequest;

        const currentUser = req.user;

        if (!currentUser || currentUser.user_id !== requestedUserId) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다. 본인의 수정 정보만 조회할 수 있습니다.'
            });
        }

        // CORRECTED: getMyInfoForChange -> getMyInfoChange
        const myInfoChange = await mypageService.getMyInfoChange(currentUser.user_id);

        if (!myInfoChange) {
            return res.status(404).json({
                success: false,
                message: '수정할 사용자 정보를 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            MyInfo: myInfoChange
        });
    });

    static getOtherInfoList = catchAsync(async (req, res) => {
        const otherInfoRequest = new MyInfoRequestDTO(req.query); 
        const { user_id: targetUserId } = otherInfoRequest;

        const currentUser = req.user;

        if (currentUser && currentUser.user_id === targetUserId) {
            return res.status(400).json({
                success: false,
                message: '본인 정보는 /api/mypage/mypage_info 엔드포인트를 이용해주세요.'
            });
        }

        const otherUserInfo = await mypageService.getOtherUserInfo(targetUserId, currentUser.user_id);

        res.status(200).json({
            success: true,
            OtherInfo: otherUserInfo
        });
    });

    static chooseKeyword = catchAsync(async (req, res) => {
        const chooseKeywordRequest = new ChooseKeywordRequestDTO(req.body);
        const { user_id: requestedUserId, keyword } = chooseKeywordRequest;

        const currentUser = req.user;

        if (!currentUser || currentUser.user_id !== requestedUserId) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다. 본인의 키워드만 선택할 수 있습니다.'
            });
        }

        const updatedKeywords = await mypageService.chooseKeyword(currentUser.user_id, keyword);

        res.status(201).json({
            success: true,
            message: '키워드 선택이 완료되었습니다.',
            user_id: currentUser.user_id,
            selectedKeywords: updatedKeywords
        });
    });

    static blockUser = catchAsync(async (req, res) => {
        const blockUserRequest = new BlockUserRequestDTO(req.body);
        const { user_id: blockerUserId, target_id: blockedUserId, reason } = blockUserRequest;

        const currentUser = req.user;

        if (!currentUser || currentUser.user_id !== blockerUserId) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다. 본인의 차단만 요청할 수 있습니다.'
            });
        }

        if (blockerUserId === blockedUserId) {
            return res.status(400).json({
                success: false,
                message: '자기 자신을 차단할 수 없습니다.'
            });
        }

        const blockedInfo = await mypageService.blockUser(blockerUserId, blockedUserId, reason);

        res.status(201).json({
            success: true,
            message: '차단이 완료되었습니다.',
            blockedInfo: {
                user_id: blockedInfo.blocker_user_id,
                target_id: blockedInfo.blocked_user_id,
                reason: blockedInfo.reason
            }
        });
    });
    static postCustomerService = catchAsync(async (req, res) => {
        const customerServiceRequest = new CreateCustomerServiceRequestDTO(req.body);
        const { user_id: requestedUserId, title, content, private: isPrivate } = customerServiceRequest;

        const currentUser = req.user;

        if (!currentUser || currentUser.user_id !== requestedUserId) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다. 본인의 고객센터 글만 등록할 수 있습니다.'
            });
        }

        const newPost = await mypageService.createCustomerServicePost(
            currentUser.user_id,
            title,
            content,
            isPrivate
        );

        res.status(201).json({
            success: true,
            message: '고객센터 글이 성공적으로 등록되었습니다.',
            service: { // Swagger 예시와 일치하도록 객체로 변경
                user_id: newPost.user_id,
                title: newPost.title,
                content: newPost.content,
                private: newPost.private,
                // category 필드는 현재 DTO 및 로직에 없으므로 일단 제외합니다.
                // 필요한 경우 DTO, 서비스, 레포지토리에 추가해야 합니다.
            }
        });
    });

    // postFollowRequest 컨트롤러 추가
    static postFollowRequest = catchAsync(async (req, res) => {
        const followRequest = new FollowRequestDTO(req.body);
        const { user_id: followerUserId, target_id: followingUserId } = followRequest;

        const currentUser = req.user;

        if (!currentUser || currentUser.user_id !== followerUserId) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다. 본인의 팔로우 요청만 할 수 있습니다.'
            });
        }

        if (followerUserId === followingUserId) {
            return res.status(400).json({
                success: false,
                message: '자기 자신을 팔로우할 수 없습니다.'
            });
        }

        const followResult = await mypageService.requestFollow(followerUserId, followingUserId);

        res.status(201).json({
            success: true,
            message: followResult.isFollowing ? "팔로우 요청이 완료되었습니다." : "팔로우가 취소되었습니다.",
            data: {
                user_id: followResult.follower_user_id,
                target_id: followResult.following_user_id,
                isFollowing: followResult.isFollowing
            }
        });
    });
}

export default mypageController;