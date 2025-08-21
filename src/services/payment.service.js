// src/services/payment.service.js
// 결제 및 포인트 관리 서비스

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { ValidationError } from '../middlewares/errorHandler.js';
import { getCurrentKSTTime } from '../utils/datetime.util.js';

const prisma = new PrismaClient();

// 몽코인 충전 패키지 정보
const CHARGE_PACKAGES = [
  {
    id: 'MC_10',
    name: '10MC',
    mongcoin: 10,
    price: 1000,
    originalPrice: 1000,
    discount: 0,
    discountText: null
  },
  {
    id: 'MC_50',
    name: '50MC',
    mongcoin: 50,
    price: 4500,
    originalPrice: 5000,
    discount: 500,
    discountText: '-₩500'
  },
  {
    id: 'MC_100',
    name: '100MC',
    mongcoin: 100,
    price: 8500,
    originalPrice: 10000,
    discount: 1500,
    discountText: '-₩1,500'
  },
  {
    id: 'MC_150',
    name: '150MC',
    mongcoin: 150,
    price: 12000,
    originalPrice: 15000,
    discount: 3000,
    discountText: '-₩3,000'
  },
  {
    id: 'MC_200',
    name: '200MC',
    mongcoin: 200,
    price: 15000,
    originalPrice: 20000,
    discount: 5000,
    discountText: '-₩5,000'
  }
];

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
          pointType: 'CHARGE'
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
            pointType: 'CHARGE',
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
   * 충전 패키지 구매
   * @param {number} userId - 사용자 ID
   * @param {string} packageId - 패키지 ID
   */
  static async purchaseChargePackage(userId, packageId) {
    try {
      // 패키지 정보 조회
      const packageInfo = CHARGE_PACKAGES.find(pkg => pkg.id === packageId);
      if (!packageInfo) {
        throw new Error('PACKAGE_NOT_FOUND');
      }

      // 트랜잭션으로 처리
      const result = await prisma.$transaction(async (tx) => {
        // 1. 충전 거래 기록 생성
        const transaction = await tx.chargeTransaction.create({
          data: {
            userId: userId,
            packageId: packageId,
            mongcoinAmount: packageInfo.mongcoin,
            price: packageInfo.price,
            status: 'COMPLETED',
            createdAt: getCurrentKSTTime()
          }
        });

        // 2. 사용자 캐시 업데이트
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            cash: {
              increment: packageInfo.mongcoin
            },
            updatedAt: getCurrentKSTTime()
          },
          select: {
            id: true,
            user_id: true,
            cash: true
          }
        });

        // 3. 포인트 히스토리 기록
        await tx.pointHistory.create({
          data: {
            userId: userId,
            pointType: 'CHARGE',
            pointChange: packageInfo.mongcoin,
            description: `${packageInfo.name} 충전 (₩${packageInfo.price.toLocaleString()})`,
            totalPoints: updatedUser.cash,
            createdAt: getCurrentKSTTime()
          }
        });

        return {
          transaction,
          updatedUser,
          packageInfo
        };
      });

      console.log('✅ 몽코인 충전 완료:', {
        userId,
        packageId,
        mongcoin: packageInfo.mongcoin,
        price: packageInfo.price,
        newBalance: result.updatedUser.cash
      });

      return {
        transactionId: result.transaction.id,
        packageInfo: packageInfo,
        newBalance: result.updatedUser.cash,
        chargedAmount: packageInfo.mongcoin,
        createdAt: result.transaction.createdAt
      };

    } catch (error) {
      console.error('❌ 몽코인 충전 실패:', error);
      throw error;
    }
  }

  /**
   * 충전 내역 조회
   * @param {number} userId - 사용자 ID
   * @param {number} limit - 조회할 개수
   */
  static async getChargeHistory(userId, limit = 10) {
    try {
      const history = await prisma.chargeTransaction.findMany({
        where: {
          userId: userId,
          status: 'COMPLETED'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        select: {
          id: true,
          packageId: true,
          mongcoinAmount: true,
          price: true,
          status: true,
          createdAt: true
        }
      });

      // 패키지 정보와 매핑
      const historyWithPackageInfo = history.map(item => {
        const packageInfo = CHARGE_PACKAGES.find(pkg => pkg.id === item.packageId);
        return {
          ...item,
          packageName: packageInfo?.name || item.packageId,
          createdAt: item.createdAt
        };
      });

      return historyWithPackageInfo;
    } catch (error) {
      console.error('❌ 충전 내역 조회 실패:', error);
      throw error;
    }
  }

  // 기존 메서드들도 유지...
  static async hasReceivedSignupBonus(userId) {
    try {
      const bonusRecord = await prisma.pointHistory.findFirst({
        where: {
          userId: userId,
          pointType: 'CHARGE'
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