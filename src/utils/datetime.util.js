/**
 * 한국 시간(KST) 처리 유틸리티
 */

/**
 * 현재 한국 시간을 반환
 * @returns {Date} KST 기준 현재 시간
 */
export function getCurrentKSTTime() {
    const now = new Date();
    // 한국 시간(UTC+9)으로 변환
    return new Date(now.getTime() + (9 * 60 * 60 * 1000));
}

/**
 * 한국 시간으로 날짜를 포맷팅하여 YYYY-MM-DD 형식으로 반환
 * @param {Date|string} dateInput - 포맷할 날짜 입력
 * @returns {string|null} YYYY-MM-DD 형식의 날짜 문자열 또는 null
 */
export function formatDateToKST(dateInput) {
    try {
        if (!dateInput) return null;
        
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            return null;
        }

        // 한국 시간(UTC+9)으로 변환
        const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        
        const year = kstDate.getUTCFullYear();
        const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(kstDate.getUTCDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Date formatting error:', error);
        return null;
    }
}

/**
 * 한국 시간으로 ISO 문자열을 반환
 * @param {Date|string} dateInput - 포맷할 날짜 입력
 * @returns {string|null} KST 기준 ISO 문자열 또는 null
 */
export function toKSTISOString(dateInput) {
    try {
        if (!dateInput) return null;
        
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            return null;
        }

        // 한국 시간(UTC+9)으로 변환
        const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        
        return kstDate.toISOString();
    } catch (error) {
        console.error('KST ISO string formatting error:', error);
        return null;
    }
}

/**
 * 현재 한국 시간을 ISO 문자열로 반환
 * @returns {string} KST 기준 현재 시간 ISO 문자열
 */
export function getCurrentKSTISOString() {
    const now = new Date();
    return toKSTISOString(now);
}

/**
 * 현재 한국 시간을 YYYY-MM-DD 형식으로 반환
 * @returns {string} KST 기준 현재 날짜 문자열
 */
export function getCurrentKSTDateString() {
    const now = new Date();
    return formatDateToKST(now);
}
