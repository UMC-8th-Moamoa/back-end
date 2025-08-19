import AWS from 'aws-sdk';
import { ValidationError } from '../middlewares/errorHandler.js';

/**
 * AWS SES 이메일 서비스
 * 더 안정적이고 확장 가능한 이메일 발송
 */
class AWSEmailService {
  constructor() {
    this.ses = new AWS.SES({
      apiVersion: '2010-12-01',
      region: process.env.AWS_REGION || 'ap-northeast-2'
    });
  }

  /**
   * 이메일 발송 (AWS SES 사용)
   * @param {Object} params - 이메일 매개변수
   */
  async sendEmail({ to, subject, html, text }) {
    const params = {
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html
          },
          Text: {
            Charset: 'UTF-8',
            Data: text || html.replace(/<[^>]*>/g, '') // HTML 태그 제거
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      ReplyToAddresses: [process.env.SMTP_FROM_EMAIL]
    };

    try {
      const result = await this.ses.sendEmail(params).promise();
      console.log(`✅ AWS SES 이메일 발송 성공: ${result.MessageId}`);
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error) {
      console.error('AWS SES 이메일 발송 실패:', error);
      throw new ValidationError('이메일 발송에 실패했습니다');
    }
  }

  /**
   * 이메일 인증 코드 발송
   */
  async sendVerificationCode(email, code, purpose = 'signup') {
    const purposeText = {
      signup: '회원가입',
      reset: '비밀번호 재설정'
    };

    const subject = `[MOA MOA] ${purposeText[purpose]} 이메일 인증`;
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #4A90E2;">MOA MOA</h1>
        <h2>${purposeText[purpose]} 이메일 인증</h2>
        <p>인증 코드: <strong style="font-size: 24px; color: #4A90E2;">${code}</strong></p>
        <p>이 코드는 10분간 유효합니다.</p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }
}

export default new AWSEmailService();
