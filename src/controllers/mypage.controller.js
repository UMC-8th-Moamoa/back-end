import { catchAsync } from '../middlewares/errorHandler.js';
import mypageService from '../services/mypage.service.js';
import prisma from '../config/prismaClient.js';
import { generateTokenPair } from '../utils/jwt.util.js';
import { 
    MyInfoRequestDTO,
    CreateCustomerServiceRequestDTO,
    GetCustomerServiceListRequestDTO,
    ChangeUserIdRequestDTO,
    ChangeUserIdResponseDTO,
    FollowRequestDTO
} from '../dtos/mypage.dto.js';

class mypageController {
    static getMyInfoList = catchAsync(async (req, res) => {
        const currentUser = req.user; 

        // 토큰의 sub(user_pk)로만 내 정보 조회 - user_id 파라미터 무시
        const myInfo = await mypageService.getMyInfo(currentUser.id);

        res.status(200).json({
            success: true,
            MyInfo: myInfo
        });
    });

    static getMyInfoChangeList = catchAsync(async (req, res) => {
        const currentUser = req.user;

        // 토큰의 sub(user_pk)로만 내 수정정보 조회 - user_id 파라미터 무시
        const myInfoChange = await mypageService.getMyInfoChange(currentUser.id);

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
        const { title, content, privacyAgreed } = customerServiceRequest;

        const currentUser = req.user;

        // 현재 사용자 정보 조회
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

        if (!currentUserInfo) {
            return res.status(404).json({
                resultType: "ERROR",
                error: {
                    errorCode: "USER_NOT_FOUND",
                    reason: "사용자 정보를 찾을 수 없습니다"
                },
                success: null
            });
        }

        const newPost = await mypageService.createCustomerServicePost(
            currentUserInfo.id,
            currentUserInfo.user_id,
            title,
            content
        );

        res.status(201).json({
            resultType: "SUCCESS",
            error: null,
            success: {
                inquiry: {
                    id: newPost.id,
                    title: newPost.title,
                    content: newPost.content,
                    userId: newPost.userId,
                    createdAt: newPost.createdAt
                },
                message: "고객센터 문의가 성공적으로 등록되었습니다."
            }
        });
    });

    static getCustomerServiceList = catchAsync(async (req, res) => {
        const listRequest = new GetCustomerServiceListRequestDTO(req.query);
        const currentUser = req.user;

        // 현재 사용자 정보 조회
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

        if (!currentUserInfo) {
            return res.status(404).json({
                resultType: "ERROR",
                error: {
                    errorCode: "USER_NOT_FOUND",
                    reason: "사용자 정보를 찾을 수 없습니다"
                },
                success: null
            });
        }

        const result = await mypageService.getCustomerServiceList(currentUserInfo.id, listRequest);

        res.status(200).json({
            resultType: "SUCCESS",
            error: null,
            success: result
        });
    });

    static getCustomerServiceDetail = catchAsync(async (req, res) => {
        const inquiryId = parseInt(req.params.inquiryId);
        const currentUser = req.user;

        if (!inquiryId || inquiryId < 1) {
            return res.status(400).json({
                resultType: "ERROR",
                error: {
                    errorCode: "VALIDATION_ERROR",
                    reason: "유효하지 않은 문의 ID입니다"
                },
                success: null
            });
        }

        // 현재 사용자 정보 조회
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

        if (!currentUserInfo) {
            return res.status(404).json({
                resultType: "ERROR",
                error: {
                    errorCode: "USER_NOT_FOUND",
                    reason: "사용자 정보를 찾을 수 없습니다"
                },
                success: null
            });
        }

        const result = await mypageService.getCustomerServiceDetail(currentUserInfo.id, inquiryId);

        res.status(200).json({
            resultType: "SUCCESS",
            error: null,
            success: result
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

    static changeUserId = catchAsync(async (req, res) => {
        const changeUserIdRequest = new ChangeUserIdRequestDTO(req.body);
        const { newUserId } = changeUserIdRequest;

        const currentUser = req.user;

        try {
            // 트랜잭션으로 ID 변경 및 토큰 생성
            const result = await mypageService.changeUserId(currentUser.id, newUserId);
            
            // 새로운 토큰 생성 (변경된 user_id 포함)
            const newTokens = generateTokenPair(result.user.id, result.user.email, result.user.user_id);
            
            const responseData = new ChangeUserIdResponseDTO(result.user);

            res.status(200).json({
                resultType: "SUCCESS",
                error: null,
                success: {
                    user: responseData,
                    tokens: newTokens, // 새로운 토큰 포함
                    message: "사용자 ID가 성공적으로 변경되었습니다."
                }
            });
        } catch (error) {
            // 중복 ID 오류 처리
            if (error.statusCode === 409) {
                return res.status(409).json({
                    resultType: "FAIL",
                    error: {
                        errorCode: "U001",
                        reason: error.message,
                        data: null
                    },
                    success: null
                });
            }
            throw error;
        }
    });
}

export default mypageController;