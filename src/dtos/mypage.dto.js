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
        this.birthday = birthday ? new Date(birthday).toISOString().split('T')[0] : null; 
        this.followers_num = followers_num || 0;
        this.following_num = following_num || 0;
        this.photo = photo || null;
    }
    
    #formatDate(dateInput) {
        try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) { 
                return null;
            }
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return null;
        }
    }
    
}

export class MyInfoChangeDTO {
    constructor({ user_id, name, birthday, email, phone, photo }) {
        if (!user_id || !name || !email) {
            throw new Error('MyInfoChangeDTO에 필수 필드가 누락되었습니다.');
        }

        this.user_id = user_id;
        this.name = name;
        this.birthday = birthday ? this.#formatDate(birthday) : null;
        this.email = email || null; // 이메일이 없을 경우를 대비
        this.phone = phone || null; // 전화번호가 없을 경우를 대비
        this.photo = photo || null;
    }

    #formatDate(dateInput) {
        try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) {
                return null;
            }
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return null;
        }
    }
}

export class OtherInfoDTO {
    constructor({ user_id, name, birthday, followers_num, following_num, is_following, is_follower, photo }) {
        this.user_id = user_id;
        this.name = name;
        this.birthday = birthday ? this.#formatDate(birthday) : null;
        this.followers_num = followers_num || 0;
        this.following_num = following_num || 0;
        this.is_following = is_following; // 내가 상대를 팔로우하는지
        this.is_follower = is_follower;   // 상대가 나를 팔로우하는지
        this.photo = photo || null;
    }

    #formatDate(dateInput) {
        try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) {
                return null;
            }
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return null;
        }
    }
}

export class CreateCustomerServiceRequestDTO {
    constructor(body) {
        if (!body || !body.user_id || !body.title || !body.content || typeof body.private === 'undefined') {
            throw new Error('user_id, title, content, private는 필수 파라미터입니다.');
        }
        if (typeof body.user_id !== 'string' || body.user_id.length < 4 || body.user_id.length > 20) {
            throw new Error('user_id는 4자 이상 20자 이하의 문자열이어야 합니다.');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(body.user_id)) {
            throw new Error('user_id는 영문, 숫자, 언더스코어만 포함할 수 있습니다.');
        }
        if (typeof body.title !== 'string' || body.title.trim() === '') {
            throw new Error('title은 비어있지 않은 문자열이어야 합니다.');
        }
        if (typeof body.content !== 'string' || body.content.trim() === '') {
            throw new Error('content는 비어있지 않은 문자열이어야 합니다.');
        }
        if (typeof body.private !== 'boolean') {
            throw new Error('private는 boolean 타입이어야 합니다.');
        }

        this.user_id = body.user_id;
        this.title = body.title.trim();
        this.content = body.content.trim();
        this.private = body.private;
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