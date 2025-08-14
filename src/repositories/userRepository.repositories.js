import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 사용자 데이터 접근 계층
 * 데이터베이스와의 직접적인 상호작용을 담당
 */
class UserRepository {
  
  /**
   * 이메일로 사용자 찾기
   * @param {string} email - 사용자 이메일
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async findByEmail(email) {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,           // id 필드 추가
      email: true,
      name: true,
      phone: true,
      user_id: true,
      password: true,     // 비밀번호 인증에 필요
      socialLogins: true, // 소셜 로그인 정보 유지
      createdAt: true,
      emailVerified: true,
      lastLoginAt: true
    }
  });
}


  /**
 * user_id로 사용자 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<User|null>} 사용자 정보
 */
async findByUserId(user_id) {
  return await prisma.user.findUnique({
    where: { user_id },
    include: {  // ✅ 소셜 로그인 관계 포함
      socialLogins: true
    }
  });
}




  /**
   * 사용자 ID로 찾기
   * @param {number} id - 사용자 ID
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
        email: true,
        name: true,
        phone: true,
        birthday: true,
        photo: true,
        cash: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            wishlists: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    // 팔로워/팔로잉 수 계산
    const followersCount = await prisma.follow.count({
      where: { followingId: user.id }  // 나를 팔로우하는 사람들
    });

    const followingCount = await prisma.follow.count({
      where: { followerId: user.id }   // 내가 팔로우하는 사람들
    });

    // _count에 추가
    user._count.followers = followersCount;
    user._count.following = followingCount;

    return user;
  }

  /**
   * 사용자 ID로 찾기 (비밀번호 포함)
   * @param {number} id - 사용자 ID
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async findByIdWithPassword(id) {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * 사용자 user_id로 찾기
   * @param {string} user_id - 사용자 user_id (로그인 ID)
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  

  /**
   * 새 사용자 생성
   * @param {Object} userData - 사용자 데이터
   * @returns {Promise<Object>} 생성된 사용자 정보
   */
  async create(userData) {
    return await prisma.user.create({
      data: userData,
      select: {
        id: true,
        user_id: true,
        email: true,
        name: true,
        phone: true,
        birthday: true,
        photo: true,
        createdAt: true
      }
    });
  }

  /**
   * 사용자 정보 업데이트
   * @param {number} id - 사용자 ID
   * @param {Object} updateData - 업데이트할 데이터
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  async update(id, updateData) {
    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        user_id: true,
        email: true,
        name: true,
        phone: true,
        birthday: true,
        photo: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
  }

  /**
   * 사용자 삭제
   * @param {number} id - 사용자 ID
   * @returns {Promise<Object>} 삭제된 사용자 정보
   */
  async delete(id) {
    return await prisma.user.delete({
      where: { id }
    });
  }

  /**
   * 이름과 전화번호로 사용자 찾기
   * @param {string} name - 사용자 이름
   * @param {string} phone - 전화번호
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async findByNameAndPhone(name, phone) {
    return await prisma.user.findFirst({
      where: {
        name,
        phone
      },
      select: {
        id: true,
        user_id: true,
        email: true,
        name: true
      }
    });
  }

  /**
   * 닉네임으로 사용자 찾기 (중복 확인용)
   * @param {string} nickname - 닉네임 (현재는 name 필드 사용)
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async findByNickname(nickname) {
    return await prisma.user.findFirst({
      where: { name: nickname },
      select: {
        id: true,
        user_id: true,
        name: true
      }
    });
  }

  /**
   * 마지막 로그인 시간 업데이트
   * @param {number} id - 사용자 ID
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  async updateLastLoginAt(id) {
    return await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
      select: {
        id: true,
        user_id: true,
        email: true,
        name: true,
        lastLoginAt: true
      }
    });
  }

  /**
   * 이메일 인증 상태 업데이트
   * @param {number} id - 사용자 ID
   * @param {boolean} verified - 인증 상태
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  async updateEmailVerification(id, verified = true) {
    return await prisma.user.update({
      where: { id },
      data: { emailVerified: verified },
      select: {
        id: true,
        user_id: true,
        email: true,
        emailVerified: true
      }
    });
  }

  /**
   * 비밀번호 업데이트
   * @param {number} id - 사용자 ID
   * @param {string} hashedPassword - 해싱된 비밀번호
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  async updatePassword(id, hashedPassword) {
    return await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: {
        id: true,
        user_id: true,
        email: true,
        name: true
      }
    });
  }

  /**
   * 소셜 로그인 정보 생성
   * @param {string} user_id - 사용자 user_id
   * @param {string} provider - 소셜 로그인 제공자
   * @param {string} token - 소셜 로그인 토큰
   * @returns {Promise<Object>} 생성된 소셜 로그인 정보
   */
  async createSocialLogin(user_id, provider, token) {
    return await prisma.socialLogin.create({
      data: {
        user_id,
        provider,
        token
      }
    });
  }

  /**
   * 소셜 로그인 정보로 사용자 찾기
   * @param {string} provider - 소셜 로그인 제공자
   * @param {string} token - 소셜 로그인 토큰
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async findBySocialLogin(provider, token) {
    const socialLogin = await prisma.socialLogin.findFirst({
      where: {
        provider,
        token
      },
      include: { user: true }
    });

    return socialLogin ? socialLogin.user : null;
  }

  /**
   * 사용자 목록 조회 (페이지네이션)
   * @param {number} skip - 건너뛸 개수
   * @param {number} take - 가져올 개수
   * @returns {Promise<Array>} 사용자 목록
   */
  async findMany(skip = 0, take = 10) {
    return await prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        user_id: true,
        email: true,
        name: true,
        photo: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * 전체 사용자 수 조회
   * @returns {Promise<number>} 전체 사용자 수
   */
  async count() {
    return await prisma.user.count();
  }

  /**
   * 사용자 존재 여부 확인
   * @param {number} id - 사용자 ID
   * @returns {Promise<boolean>} 존재 여부
   */
  async exists(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });
    return !!user;
  }

  /**
   * 이메일 존재 여부 확인
   * @param {string} email - 이메일
   * @returns {Promise<boolean>} 존재 여부
   */
  async emailExists(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    return !!user;
  }

  /**
   * 데이터베이스 연결 해제
   */
  async disconnect() {
    await prisma.$disconnect();
  }
}

export default new UserRepository();
