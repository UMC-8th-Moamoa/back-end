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
    constructor({ user_id, name, birthday, followers_num, following_num, image }) {
        this.user_id = user_id;
        this.name = name;
        this.birthday = birthday ? new Date(birthday).toISOString().split('T')[0] : null; 
        this.followers_num = followers_num || 0;
        this.following_num = following_num || 0;
        this.image = image || null;
    }
}