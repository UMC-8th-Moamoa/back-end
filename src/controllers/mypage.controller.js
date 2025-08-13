import { catchAsync } from '../middlewares/errorHandler.js';
import mypageService from '../services/mypage.service.js';
import prisma from '../config/prismaClient.js';
import { 
    MyInfoRequestDTO,
    CreateCustomerServiceRequestDTO,
    FollowRequestDTO,
    ChangeUserIdRequestDTO,
    ChangeUserIdResponseDTO
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

        // currentUser.user_id가 없는 경우 데이터베이스에서 조회
        let currentUserInfo = currentUser;
        if (!currentUser.user_id) {
            currentUserInfo = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: {
                    id: true,
                    user_id: true,
                    email: true,
                    name: true
                }
            });
        }

        if (!currentUserInfo || currentUserInfo.user_id !== requestedUserId) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다. 본인의 수정 정보만 조회할 수 있습니다.'
            });
        }

        const myInfoChange = await mypageService.getMyInfoChange(currentUserInfo.user_id);

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
        console.log('=== DEBUG: Controller getOtherInfoList ===');
        console.log('req.query:', req.query);
        console.log('req.params:', req.params);
        console.log('req.body:', req.body);
        
        // 쿼리 파라미터 직접 확인
        if (!req.query.user_id) {
            console.log('❌ user_id가 쿼리 파라미터에 없습니다');
            return res.status(400).json({
                success: false,
                message: 'user_id 쿼리 파라미터가 필요합니다. 예: ?user_id=lesly'
            });
        }
    
        console.log('✅ 쿼리에서 받은 user_id:', req.query.user_id);
    
        try {
            const otherInfoRequest = new MyInfoRequestDTO(req.query);
            console.log('✅ DTO 생성 성공:', otherInfoRequest);
            
            const { user_id: targetUserId } = otherInfoRequest;
            console.log('✅ targetUserId 추출:', targetUserId);
    
            const currentUser = req.user;
            console.log('✅ currentUser:', currentUser);

            // Make sure currentUser exists
            if (!currentUser) {
                console.error('❌ currentUser is null/undefined');
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다.'
                });
            }

            // currentUser.user_id가 없는 경우 데이터베이스에서 조회
            let currentUserInfo = currentUser;
            if (!currentUser.user_id) {
                console.log('🔍 currentUser.user_id가 없어서 DB에서 조회합니다...');
                currentUserInfo = await prisma.user.findUnique({
                    where: { id: currentUser.id },
                    select: {
                        id: true,
                        user_id: true,
                        email: true,
                        name: true
                    }
                });
                
                if (!currentUserInfo || !currentUserInfo.user_id) {
                    console.error('❌ DB에서도 사용자 정보를 찾을 수 없습니다');
                    return res.status(401).json({
                        success: false,
                        message: '사용자 정보를 찾을 수 없습니다.'
                    });
                }
                console.log('✅ DB에서 조회한 사용자 정보:', currentUserInfo);
            }
    
            if (currentUserInfo.user_id === targetUserId) {
                return res.status(400).json({
                    success: false,
                    message: '본인 정보는 /api/mypage/mypage_info 엔드포인트를 이용해주세요.'
                });
            }
    
            console.log('🚀 서비스 호출 - targetUserId:', targetUserId, 'currentUser.user_id:', currentUserInfo.user_id);
            
            const otherInfo = await mypageService.getOtherUserInfo(targetUserId, currentUserInfo.user_id);
    
            res.status(200).json({
                success: true,
                OtherInfo: otherInfo
            });
            
        } catch (error) {
            console.error('❌ 컨트롤러 에러:', error);
            throw error;
        }
    });
    
    static postCustomerService = catchAsync(async (req, res) => {
        const customerServiceRequest = new CreateCustomerServiceRequestDTO(req.body);
        const { user_id: requestedUserId, title, content, private: isPrivate } = customerServiceRequest;

        const currentUser = req.user;

        // currentUser.user_id가 없는 경우 데이터베이스에서 조회
        let currentUserInfo = currentUser;
        if (!currentUser.user_id) {
            currentUserInfo = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: {
                    id: true,
                    user_id: true,
                    email: true,
                    name: true
                }
            });
        }

        if (!currentUserInfo || currentUserInfo.user_id !== requestedUserId) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다. 본인의 고객센터 글만 등록할 수 있습니다.'
            });
        }

        const newPost = await mypageService.createCustomerServicePost(
            currentUserInfo.user_id,
            title,
            content,
            isPrivate
        );

        res.status(201).json({
            success: true,
            message: '고객센터 글이 성공적으로 등록되었습니다.',
            service: {
                user_id: newPost.user_id,
                title: newPost.title,
                content: newPost.content,
                private: newPost.private,
            }
        });
    });

    static postFollowRequest = catchAsync(async (req, res) => {
        const followRequest = new FollowRequestDTO(req.body);
        const { user_id: followerUserId, target_id: followingUserId } = followRequest;

        const currentUser = req.user;

        // currentUser.user_id가 없는 경우 데이터베이스에서 조회
        let currentUserInfo = currentUser;
        if (!currentUser.user_id) {
            currentUserInfo = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: {
                    id: true,
                    user_id: true,
                    email: true,
                    name: true
                }
            });
        }

        if (!currentUserInfo || currentUserInfo.user_id !== followerUserId) {
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

    // 사용자 ID 변경
    static changeUserId = catchAsync(async (req, res) => {
        console.log('=== DEBUG: Controller changeUserId ===');
        console.log('req.body:', req.body);
        console.log('req.user:', req.user);

        // DTO 검증
        const changeUserIdRequestDTO = new ChangeUserIdRequestDTO(req.body);
        const { newUserId } = changeUserIdRequestDTO;

        const currentUserId = req.user?.user_id;
        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }

        console.log('Current User ID:', currentUserId);
        console.log('New User ID:', newUserId);

        // 서비스 호출
        const updatedUserData = await mypageService.changeUserId(currentUserId, newUserId);
        
        // DTO로 응답 포맷
        const responseData = new ChangeUserIdResponseDTO(updatedUserData);

        res.status(200).json({
            success: true,
            message: '사용자 ID가 성공적으로 변경되었습니다.',
            data: responseData
        });
    });
}

export default mypageController;