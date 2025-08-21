import nodemailer from 'nodemailer';
import { ValidationError } from '../middlewares/errorHandler.js';

/**
 * 이메일 발송 전략 선택
 */
const getEmailStrategy = () => {
  // 모든 환경에서 SMTP 사용 (AWS SES는 추후 구현)
  return 'smtp';
};

/**
 * 이메일 발송 유틸리티
 */
class EmailService {
  constructor() {
    this.strategy = getEmailStrategy();
    this.transporter = null;
    
    if (this.strategy === 'smtp') {
      this.initializeTransporter();
    }
  }

  /**
   * SMTP 전송기 초기화
   */
  initializeTransporter() {
    try {
      // SMTP 설정이 모두 있는지 확인
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP 설정이 불완전합니다. 일부 환경 변수가 누락되었습니다.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // STARTTLS 사용
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // 연결 테스트 (선택적)
      if (process.env.NODE_ENV === 'development') {
        this.transporter.verify((error, success) => {
          if (error) {
            console.warn('❌ SMTP 연결 실패:', error.message);
          } else {
            console.log('✅ SMTP 서버 연결 성공');
          }
        });
      }
    } catch (error) {
      console.error('SMTP 전송기 초기화 실패:', error);
      this.transporter = null;
    }
  }

  /**
   * 이메일 발송 공통 메서드
   * @param {Object} mailOptions - 이메일 옵션
   * @returns {Promise<Object>} 발송 결과
   */
  async sendMail(mailOptions) {
    if (!this.transporter) {
      console.error('❌ 이메일 전송기가 초기화되지 않음');
      throw new ValidationError('이메일 서비스가 설정되지 않았습니다');
    }

    try {
      console.log('📧 이메일 발송 시도:', {
        to: mailOptions.to,
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        subject: mailOptions.subject
      });

      const info = await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        ...mailOptions
      });

      console.log(`✅ 이메일 발송 성공: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ 이메일 발송 실패 - 상세 정보:');
      console.error('에러 코드:', error.code);
      console.error('에러 메시지:', error.message);
      console.error('전체 에러:', error);
      
      // SMTP 인증 에러인지 확인
      if (error.code === 'EAUTH') {
        console.error('🔐 SMTP 인증 실패 - Gmail 앱 비밀번호를 확인하세요');
      }
      
      throw new ValidationError(`이메일 발송에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 이메일 인증 코드 발송
   * @param {string} email - 수신자 이메일
   * @param {string} code - 인증 코드
   * @param {string} purpose - 인증 목적 (signup, reset)
   * @returns {Promise<Object>} 발송 결과
   */
  async sendVerificationCode(email, code, purpose = 'signup') {
    const purposeText = {
      signup: '회원가입',
      reset: '비밀번호 재설정'
    };

    const subject = `[MOA MOA] ${purposeText[purpose]} 이메일 인증`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4A90E2; margin: 0;">MOA MOA</h1>
          <p style="color: #666; margin: 5px 0;">생일선물 공동구매 플랫폼</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">${purposeText[purpose]} 이메일 인증</h2>
          <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">
            안녕하세요! MOA MOA ${purposeText[purpose]}을 위한 이메일 인증 코드입니다.<br>
            아래 인증 코드를 입력해주세요.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #4A90E2; letter-spacing: 5px;">
              ${code}
            </div>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            이 인증 코드는 10분간 유효합니다.<br>
            본인이 요청하지 않았다면 이 이메일을 무시해주세요.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            © 2025 MOA MOA. All rights reserved.<br>
            이 이메일은 자동으로 발송된 메일입니다.
          </p>
        </div>
      </div>
    `;

    return await this.sendMail({
      to: email,
      subject,
      html
    });
  }

  /**
   * 비밀번호 재설정 인증 코드 발송 (이메일 인증 코드 발송과 동일하지만 목적이 다름)
   * @param {string} email - 수신자 이메일
   * @param {string} code - 인증 코드
   * @returns {Promise<Object>} 발송 결과
   */
  async sendPasswordResetCode(email, code) {
    return await this.sendVerificationCode(email, code, 'reset');
  }

  /**
   * 비밀번호 재설정 링크 발송
   * @param {string} email - 수신자 이메일
   * @param {string} resetToken - 재설정 토큰
   * @returns {Promise<Object>} 발송 결과
   */
  async sendPasswordResetLink(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = '[MOA MOA] 비밀번호 재설정 안내';
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4A90E2; margin: 0;">MOA MOA</h1>
          <p style="color: #666; margin: 5px 0;">생일선물 공동구매 플랫폼</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">비밀번호 재설정</h2>
          <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">
            안녕하세요!<br>
            비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: #4A90E2; color: white; 
                      padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                      font-weight: bold;">
              비밀번호 재설정하기
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            이 링크는 30분간 유효합니다.<br>
            링크가 작동하지 않으면 아래 URL을 복사하여 브라우저에 직접 입력해주세요:<br>
            <span style="word-break: break-all; color: #4A90E2;">${resetUrl}</span>
          </p>
          
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            본인이 요청하지 않았다면 이 이메일을 무시해주세요.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            © 2025 MOA MOA. All rights reserved.<br>
            이 이메일은 자동으로 발송된 메일입니다.
          </p>
        </div>
      </div>
    `;

    return await this.sendMail({
      to: email,
      subject,
      html
    });
  }

  /**
   * 아이디 찾기 결과 발송
   * @param {string} email - 수신자 이메일
   * @param {string} userId - 찾은 사용자 ID
   * @returns {Promise<Object>} 발송 결과
   */
  async sendFoundUserId(email, userId) {
    const subject = '[MOA MOA] 아이디 찾기 결과';
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4A90E2; margin: 0;">MOA MOA</h1>
          <p style="color: #666; margin: 5px 0;">생일선물 공동구매 플랫폼</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">아이디 찾기 결과</h2>
          <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">
            요청하신 아이디 찾기 결과입니다.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #666; margin-bottom: 10px;">회원님의 아이디는</p>
            <div style="font-size: 24px; font-weight: bold; color: #4A90E2;">
              ${userId}
            </div>
            <p style="color: #666; margin-top: 10px;">입니다.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" 
               style="display: inline-block; background: #4A90E2; color: white; 
                      padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                      font-weight: bold;">
              로그인하러 가기
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            © 2025 MOA MOA. All rights reserved.<br>
            이 이메일은 자동으로 발송된 메일입니다.
          </p>
        </div>
      </div>
    `;

    return await this.sendMail({
      to: email,
      subject,
      html
    });
  }

  /**
   * 이메일 서비스 상태 확인
   * @returns {boolean} 서비스 사용 가능 여부
   */
  isAvailable() {
    // 🔍 디버깅: 환경 변수 확인
    console.log('🔍 SMTP 환경 변수 디버깅:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT_SET');
    console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT_SET');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT_SET');
    console.log('transporter:', this.transporter ? 'CREATED' : 'NULL');
    
    const isAvailable = this.transporter !== null && 
           process.env.SMTP_HOST && 
           process.env.SMTP_USER && 
           process.env.SMTP_PASS;
    
    console.log('🔍 이메일 서비스 사용 가능:', isAvailable);
    
    return isAvailable;
  }
}

// 싱글톤 인스턴스 생성
const emailService = new EmailService();

export default emailService;