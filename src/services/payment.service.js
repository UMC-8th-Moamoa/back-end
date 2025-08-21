// src/services/payment.service.js
// 결제 및 포인트 관리 서비스

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { ValidationError } from '../middlewares/errorHandler.js';
import { getCurrentKSTTime } from '../utils/datetime.util.js';

const prisma = new PrismaClient();

class PaymentService {
  
  /**
   * 회원가입 시 기본 포인트 지급
   * @param {number} userId - 사용자 ID (autoincrement)
   * @param {string} userStringId - 사용자 문자열 ID
   * @param {number} initialPoints - 초기 지급 포인트 (기본값: 400)
   */
  static async giveSignupBonus(userId, userStringId, initialPoints = 400) {
    try {
      console.log('💰 회원가입 보너스 지급 시작:', {
        userId,
        userStringId,
        initialPoints
      });

      // 사용자 존재 여부 확인
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, user_id: true, cash: true, name: true }
      });

      if (!existingUser) {
        throw new ValidationError('사용자를 찾을 수 없습니다');
      }

      // 이미 회원가입 보너스를 받았는지 확인
      const existingBonus = await prisma.pointHistory.findFirst({
        where: {
          userId: userId,
          pointType: 'SIGNUP_BONUS'
        }
      });

      if (existingBonus) {
        console.log('⚠️ 이미 회원가입 보너스를 받은 사용자:', userId);
        return {
          user: existingUser,
          pointHistory: existingBonus,
          alreadyReceived: true
        };
      }

      // 트랜잭션으로 안전하게 처리
      const result = await prisma.$transaction(async (tx) => {
        // 1. 사용자의 현재 캐시 업데이트
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { 
            cash: {
              increment: initialPoints
            },
            updatedAt: getCurrentKSTTime()
          },
          select: {
            id: true,
            user_id: true,
            cash: true,
            name: true
          }
        });

        // 2. 포인트 히스토리 기록 생성
        const pointHistory = await tx.pointHistory.create({
          data: {
            userId: userId,
            pointType: 'SIGNUP_BONUS',
            pointChange: initialPoints,
            description: '회원가입 축하 보너스',
            totalPoints: updatedUser.cash,
            createdAt: getCurrentKSTTime()
          }
        });

        return {
          user: updatedUser,
          pointHistory: pointHistory
        };
      });

      console.log('✅ 회원가입 보너스 지급 완료:', {
        userId: result.user.id,
        userStringId: result.user.user_id,
        previousCash: existingUser.cash,
        newCash: result.user.cash,
        bonusAmount: initialPoints,
        historyId: result.pointHistory.id
      });

      return result;

    } catch (error) {
      console.error('❌ 회원가입 보너스 지급 실패:', error);
      throw new ValidationError(`회원가입 보너스 지급 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 사용자 포인트 잔액 조회
   * @param {number} userId - 사용자 ID
   */
  static async getUserBalance(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          user_id: true,
          cash: true,
          name: true,
          email: true
        }
      });

      if (!user) {
        throw new ValidationError('사용자를 찾을 수 없습니다');
      }

      return {
        userId: user.id,
        userStringId: user.user_id,
        balance: user.cash || 0,
        name: user.name,
        email: user.email
      };

    } catch (error) {
      console.error('❌ 사용자 잔액 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 포인트 히스토리 조회
   * @param {number} userId - 사용자 ID
   * @param {number} limit - 조회할 개수 (기본값: 10)
   * @param {string} pointType - 포인트 타입 필터 (선택사항)
   */
  static async getPointHistory(userId, limit = 10, pointType = null) {
    try {
      const whereCondition = { userId };
      if (pointType) {
        whereCondition.pointType = pointType;
      }

      const histories = await prisma.pointHistory.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          pointType: true,
          pointChange: true,
          description: true,
          totalPoints: true,
          createdAt: true
        }
      });

      return histories;

    } catch (error) {
      console.error('❌ 포인트 히스토리 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 포인트 차감 (구매 등)
   * @param {number} userId - 사용자 ID
   * @param {number} amount - 차감할 포인트
   * @param {string} description - 차감 사유
   * @param {string} pointType - 포인트 타입 (기본값: 'ITEM_PURCHASE')
   */
  static async deductPoints(userId, amount, description, pointType = 'ITEM_PURCHASE') {
    try {
      if (!amount || amount <= 0) {
        throw new ValidationError('차감할 포인트는 0보다 커야 합니다');
      }

      const result = await prisma.$transaction(async (tx) => {
        // 현재 사용자 정보 조회
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, user_id: true, cash: true, name: true }
        });

        if (!user) {
          throw new ValidationError('사용자를 찾을 수 없습니다');
        }

        if ((user.cash || 0) < amount) {
          throw new ValidationError(`포인트가 부족합니다. 현재 잔액: ${user.cash || 0}, 필요 포인트: ${amount}`);
        }

        // 포인트 차감
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            cash: {
              decrement: amount
            },
            updatedAt: getCurrentKSTTime()
          },
          select: {
            id: true,
            user_id: true,
            cash: true
          }
        });

        // 포인트 히스토리 기록
        const pointHistory = await tx.pointHistory.create({
          data: {
            userId: userId,
            pointType: pointType,
            pointChange: -amount, // 음수로 기록
            description: description,
            totalPoints: updatedUser.cash,
            createdAt: getCurrentKSTTime()
          }
        });

        return {
          user: updatedUser,
          pointHistory: pointHistory
        };
      });

      console.log('✅ 포인트 차감 완료:', {
        userId,
        amount,
        newBalance: result.user.cash,
        description,
        pointType
      });

      return result;

    } catch (error) {
      console.error('❌ 포인트 차감 실패:', error);
      throw error;
    }
  }

  /**
   * 포인트 추가 (충전 등)
   * @param {number} userId - 사용자 ID
   * @param {number} amount - 추가할 포인트
   * @param {string} description - 추가 사유
   * @param {string} pointType - 포인트 타입 (기본값: 'CHARGE')
   */
  static async addPoints(userId, amount, description, pointType = 'CHARGE') {
    try {
      if (!amount || amount <= 0) {
        throw new ValidationError('추가할 포인트는 0보다 커야 합니다');
      }

      const result = await prisma.$transaction(async (tx) => {
        // 사용자 존재 확인
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, user_id: true, cash: true }
        });

        if (!user) {
          throw new ValidationError('사용자를 찾을 수 없습니다');
        }

        // 포인트 추가
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            cash: {
              increment: amount
            },
            updatedAt: getCurrentKSTTime()
          },
          select: {
            id: true,
            user_id: true,
            cash: true
          }
        });

        // 포인트 히스토리 기록
        const pointHistory = await tx.pointHistory.create({
          data: {
            userId: userId,
            pointType: pointType,
            pointChange: amount, // 양수로 기록
            description: description,
            totalPoints: updatedUser.cash,
            createdAt: getCurrentKSTTime()
          }
        });

        return {
          user: updatedUser,
          pointHistory: pointHistory
        };
      });

      console.log('✅ 포인트 추가 완료:', {
        userId,
        amount,
        newBalance: result.user.cash,
        description,
        pointType
      });

      return result;

    } catch (error) {
      console.error('❌ 포인트 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 포인트 사용 내역 통계
   * @param {number} userId - 사용자 ID
   * @param {Date} startDate - 시작 날짜 (선택사항)
   * @param {Date} endDate - 종료 날짜 (선택사항)
   */
  static async getPointStats(userId, startDate = null, endDate = null) {
    try {
      const whereCondition = { userId };
      
      if (startDate && endDate) {
        whereCondition.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }

      // 포인트 타입별 집계
      const stats = await prisma.pointHistory.groupBy({
        by: ['pointType'],
        where: whereCondition,
        _sum: {
          pointChange: true
        },
        _count: {
          id: true
        }
      });

      // 전체 통계
      const totalStats = await prisma.pointHistory.aggregate({
        where: whereCondition,
        _sum: {
          pointChange: true
        },
        _count: {
          id: true
        }
      });

      return {
        byType: stats,
        total: {
          totalTransactions: totalStats._count.id,
          totalPointChange: totalStats._sum.pointChange || 0
        }
      };

    } catch (error) {
      console.error('❌ 포인트 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 회원가입 보너스 수령 여부 확인
   * @param {number} userId - 사용자 ID
   */
  static async hasReceivedSignupBonus(userId) {
    try {
      const bonusRecord = await prisma.pointHistory.findFirst({
        where: {
          userId: userId,
          pointType: 'SIGNUP_BONUS'
        },
        select: {
          id: true,
          pointChange: true,
          createdAt: true
        }
      });

      return {
        hasReceived: !!bonusRecord,
        bonusRecord: bonusRecord
      };

    } catch (error) {
      console.error('❌ 회원가입 보너스 수령 여부 확인 실패:', error);
      throw error;
    }
  }
}

export default PaymentService;