import { v4 } from 'uuid';

// 기본 UUID 생성 (표준 형식)
export const createUUID = () => {
    return v4();
};

// 커스텀 UUID 생성 (기존 형식 유지)
export const createCustomUUID = () => {
    const tokens = v4().split('-');
    console.log("Custom UUID tokens:", tokens);
    return tokens[2] + tokens[1] + tokens[0] + tokens[3] + tokens[4];
};

// 짧은 UUID 생성 (파일명 등에 사용)
export const createShortUUID = () => {
    return v4().replace(/-/g, '').substring(0, 16);
};

// UUID 검증 함수
export const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// 미들웨어: 요청에 UUID 추가
export const addUUIDToRequest = (req, res, next) => {
    req.uuid = createUUID();
    req.shortUuid = createShortUUID();
    next();
};