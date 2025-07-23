import { catchAsync } from '../middlewares/errorHandler.js';
import { MyInfoRequestDTO } from '../dtos/mypage.dto.js';
import mypageService from '../services/mypage.service.js';

class mypageController {
    static getMyInfoList = catchAsync(async (req, res) => {
        const myInfoRequest = new MyInfoRequestDTO(req.query);
        const { user_id: requestedUserId } = myInfoRequest;

        const currentUser = req.user; 

        if (!currentUser || currentUser.user_id !== requestedUserId) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다. 본인의 정보만 조회할 수 있습니다.'
            });
        }

        const myInfo = await mypageService.getMyInfo(currentUser.user_id);

        res.status(200).json({
            success: true,
            MyInfo: myInfo
        });
    });
}

export default mypageController;