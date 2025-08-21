import { formatDateToKST, toKSTISOString } from '../utils/datetime.util.js';

export class MyInfoRequestDTO {
    constructor(query) {
        if (!query || !query.user_id) {
            throw new Error('user_id는 필수 파라미터입니다.');
        }
        if (typeof query.user_id !== 'string' || query.user_id.length < 4 || query.user_id.length > 20) {
            throw new Error('user_id는 4자 이상 20자 이하의 문자열이어야 합니다.');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(query.user_id)) {
            throw new Error('user_id는 영문, 숫자, 언더스코어만 포함할 수 있습니다.');
        }
        this.user_id = query.user_id;
    }
}

export class MyInfoListDTO {
    constructor({ user_id, name, birthday, followers_num, following_num, photo }) {
        this.user_id = user_id;
        this.name = name;
        this.birthday = formatDateToKST(birthday);
        this.followers_num = followers_num || 0;
        this.following_num = following_num || 0;
        this.photo = photo || null;
    }
}

export class MyInfoChangeDTO {
    constructor({ user_id, name, birthday, email, phone, photo }) {
        if (!user_id || !name || !email) {
            throw new Error('MyInfoChangeDTO에 필수 필드가 누락되었습니다.');
        }

        this.user_id = user_id;
        this.name = name;
        this.birthday = formatDateToKST(birthday);
        this.email = email || null;
        this.phone = phone || null;
        this.photo = photo || null;
    }
}

export class OtherInfoDTO {
    constructor({ user_id, name, birthday, followers_num, following_num, is_following, is_follower, photo }) {
        this.user_id = user_id;
        this.name = name;
        this.birthday = formatDateToKST(birthday);
        this.followers_num = followers_num || 0;
        this.following_num = following_num || 0;
        this.is_following = is_following; // 내가 상대를 팔로우하는지
        this.is_follower = is_follower;   // 상대가 나를 팔로우하는지
        this.photo = photo || null;
    }
}

export class CreateCustomerServiceRequestDTO {
    constructor(body) {
        if (!body || !body.title || !body.content || typeof body.privacyAgreed === 'undefined') {
            throw new Error('title, content, privacyAgreed는 필수 파라미터입니다.');
        }
        if (typeof body.title !== 'string' || body.title.trim() === '') {
            throw new Error('title은 비어있지 않은 문자열이어야 합니다.');
        }
        if (typeof body.content !== 'string' || body.content.trim() === '') {
            throw new Error('content는 비어있지 않은 문자열이어야 합니다.');
        }
        if (typeof body.privacyAgreed !== 'boolean' || !body.privacyAgreed) {
            throw new Error('개인정보 수집에 동의해야 합니다.');
        }

        this.title = body.title.trim();
        this.content = body.content.trim();
        this.privacyAgreed = body.privacyAgreed;
    }
}

export class GetCustomerServiceListRequestDTO {
    constructor(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;

        if (page < 1) {
            throw new Error('페이지 번호는 1 이상이어야 합니다.');
        }
        if (limit < 1 || limit > 50) {
            throw new Error('페이지당 항목 수는 1-50 사이여야 합니다.');
        }

        this.page = page;
        this.limit = limit;
        this.offset = (page - 1) * limit;
    }
}

export class ChangeUserIdRequestDTO {
    constructor(body) {
        if (!body || !body.newUserId) {
            throw new Error('newUserId는 필수 파라미터입니다.');
        }
        if (typeof body.newUserId !== 'string' || body.newUserId.length < 4 || body.newUserId.length > 20) {
            throw new Error('newUserId는 4자 이상 20자 이하의 문자열이어야 합니다.');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(body.newUserId)) {
            throw new Error('newUserId는 영문, 숫자, 언더스코어만 포함할 수 있습니다.');
        }

        this.newUserId = body.newUserId.trim();
    }
}

export class ChangeUserIdResponseDTO {
    constructor({ user_id, name, email, phone, photo }) {
        this.user_id = user_id;
        this.name = name;
        this.email = email || null;
        this.phone = phone || null;
        this.photo = photo || null;
    }
}

export class FollowRequestDTO {
    constructor(body) {
        if (!body || !body.user_id || !body.target_id) {
            throw new Error('user_id와 target_id는 필수 파라미터입니다.');
        }
        if (typeof body.user_id !== 'string' || body.user_id.length < 4 || body.user_id.length > 20) {
            throw new Error('user_id는 4자 이상 20자 이하의 문자열이어야 합니다.');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(body.user_id)) {
            throw new Error('user_id는 영문, 숫자, 언더스코어만 포함할 수 있습니다.');
        }
        if (typeof body.target_id !== 'string' || body.target_id.length < 4 || body.target_id.length > 20) {
            throw new Error('target_id는 4자 이상 20자 이하의 문자열이어야 합니다.');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(body.target_id)) {
            throw new Error('target_id는 영문, 숫자, 언더스코어만 포함할 수 있습니다.');
        }

        this.user_id = body.user_id;
        this.target_id = body.target_id;
    }
}

export class FollowListRequestDTO {
    constructor(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;

        if (page < 1) {
            throw new Error('페이지 번호는 1 이상이어야 합니다.');
        }
        if (limit < 1 || limit > 50) {
            throw new Error('페이지당 항목 수는 1-50 사이여야 합니다.');
        }

        this.page = page;
        this.limit = limit;
        this.offset = (page - 1) * limit;
    }
}

export class FollowerDTO {
    constructor({ user_id, name, photo, followed_at, is_following, is_mutual }) {
        this.user_id = user_id;
        this.name = name;
        this.photo = photo || null;
        this.followed_at = followed_at;
        this.is_following = is_following || false;
        this.is_mutual = is_mutual || false;
    }
}

export class FollowingDTO {
    constructor({ user_id, name, photo, followed_at, is_follower, is_mutual }) {
        this.user_id = user_id;
        this.name = name;
        this.photo = photo || null;
        this.followed_at = followed_at;
        this.is_follower = is_follower || false;
        this.is_mutual = is_mutual || false;
    }
}

// 프로필 이미지 업데이트 요청 DTO
export class ProfileImageUpdateRequestDTO {
    constructor(body) {
        if (!body || !body.imageUrl) {
            throw new Error('imageUrl은 필수 파라미터입니다.');
        }
        
        if (typeof body.imageUrl !== 'string') {
            throw new Error('imageUrl은 문자열이어야 합니다.');
        }
        
        // URL 형식 검증
        const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|bmp)$/i;
        if (!urlRegex.test(body.imageUrl)) {
            throw new Error('유효한 이미지 URL 형식이 아닙니다.');
        }
        
        // URL 길이 제한
        if (body.imageUrl.length > 500) {
            throw new Error('이미지 URL은 500자를 초과할 수 없습니다.');
        }

        this.imageUrl = body.imageUrl.trim();
    }
}

// 프로필 이미지 업데이트 응답 DTO
export class ProfileImageUpdateResponseDTO {
    constructor({ imageUrl, message }) {
        this.imageUrl = imageUrl;
        this.message = message;
    }
}