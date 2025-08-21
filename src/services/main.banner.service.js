// main.banner.service.js
// 홈 메인 배너 우선순위 로직: 1) 잔금, 2) 본인 생일 이벤트, 3) 친구 모아 참여, 4) 기본 배너

/**
 * @param {Object} user - 사용자 정보 (userId 등)
 * @param {Array} moas - 사용자의 모아모아 리스트(배너 타입 포함)
 * @param {Array} upcomingBirthdays - 임박한 친구 생일 리스트 (optional)
 * @returns {Object} mainBanner - 메인 배너 정보 { type, title, description, actionText, ... }
 */
export function getMainBanner(user, moas, upcomingBirthdays = []) {

  // 1순위: 잔금 처리 필요 (예: bannerType === 'balance')
  const balanceBanner = moas.find(moa => moa.bannerType === 'balance');
  if (balanceBanner) {
    return {
      type: 'balance',
      title: '송금을 완료했어요!',
      description: '잔금을 현명하게 소비하러 가요',
      actionText: '잔금 처리하기',
      moaId: balanceBanner.id
    };
  }

  // 2순위: 본인 생일 당일 축하 메시지
  if (user && user.birthday) {
    const today = new Date();
    const birthday = new Date(user.birthday);
    if (
      today.getMonth() === birthday.getMonth() &&
      today.getDate() === birthday.getDate()
    ) {
      return {
        type: 'birthday_today',
        title: `${user.name}님의 생일을 축하합니다!`,
        description: '',
        actionText: '',
        moaId: null
      };
    }
  }

  // 3순위: 본인 생일 이벤트 진행 중 (bannerType === 'my_in_progress' && status가 active) 또는 본인 생일이 7일 이내
  const myEventBanner = moas.find(moa => moa.bannerType === 'my_in_progress' && moa.eventStatus === 'active');
  // 본인 생일 D-7 이하 여부 계산
  let isMyBirthdayUpcoming = false;
  let myBirthdayDday = null;
  let hasMyCompletedEvent = false;
  if (user && user.birthday) {
    const today = new Date();
    const birthday = new Date(user.birthday);
    // 올해 생일 날짜 계산
    birthday.setFullYear(today.getFullYear());
    // 이미 지났으면 내년으로
    if (birthday < today) birthday.setFullYear(today.getFullYear() + 1);
    const diff = Math.floor((birthday - today) / (1000 * 60 * 60 * 24));
    myBirthdayDday = diff;
    if (diff >= 0 && diff <= 7) isMyBirthdayUpcoming = true;
    // 본인 이벤트가 종료된 게 있는지 확인
    hasMyCompletedEvent = moas.some(moa => moa.isBirthdayPerson && moa.eventStatus === 'completed');
  }
  // 본인 이벤트가 종료된 경우에는 isMyBirthdayUpcoming이 true여도 mainBanner에 my_in_progress를 노출하지 않음
  if (myEventBanner || (isMyBirthdayUpcoming && !hasMyCompletedEvent)) {
    // 단, myEventBanner가 있을 때만 moaId를 전달
    return {
      type: 'my_in_progress',
      title: `${user.name}님을 위한 모아가 진행 중이에요!`,
      description: '',
      actionText: '모아모아 보러가기',
      moaId: myEventBanner ? myEventBanner.id : null
    };
  }

  // 4순위: 친구의 모아에 참여해봐요! (친구 생일 임박/오늘도 포함)
  if ((upcomingBirthdays && upcomingBirthdays.length > 0) || moas.find(moa => moa.bannerType === 'participating')) {
    // upcomingBirthdays가 있으면 그 중 가장 가까운 친구의 eventId 사용, 없으면 기존 participating 배너 사용
    let moaId = null;
    if (upcomingBirthdays && upcomingBirthdays.length > 0) {
      // dDay가 가장 작은 친구의 eventId
      const sorted = [...upcomingBirthdays].sort((a, b) => a.birthday.dDay - b.birthday.dDay);
      moaId = sorted[0].eventId;
    } else {
      const friendBanner = moas.find(moa => moa.bannerType === 'participating');
      if (friendBanner) moaId = friendBanner.id;
    }
    return {
      type: 'participating',
      title: '친구의 모아에 참여해봐요!',
      description: '',
      actionText: '',
      moaId
    };
  }

  // 5순위: 기본 배너
  return {
    type: 'default',
    title: '마음을 모아 기쁨을 나누는 모아모아!',
    description: '',
    actionText: '',
    moaId: null
  };
}
