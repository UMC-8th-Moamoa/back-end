import mypageRepository from '../repositories/mypage.repository.js';
import { MyInfoListDTO } from '../dtos/mypage.dto.js';

class MypageService {
    async getMyInfo(userIdFromToken) {
        const userInfo = await mypageRepository.findUserByUserId(userIdFromToken);

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
            image: userInfo.image
        });

        return formattedMyInfo;
    }
}

export default new MypageService();