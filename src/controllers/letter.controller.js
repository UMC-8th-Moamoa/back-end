import { catchAsync } from '../middlewares/errorHandler.js';
import { letterService } from '../services/letter.service.js';

/**
 * @swagger
 * /api/letters:
 *   get:
 *     summary: 편지 목록 조회
 *     description: 특정 생일 이벤트에 대해 받은 편지 목록을 페이징으로 조회합니다.
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: birthdayEventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 생일 이벤트 ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 15
 *         description: 한 페이지당 데이터 개수
 *     responses:
 *       200:
 *         description: 편지 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 33
 *                       senderId:
 *                         type: integer
 *                         example: 5
 *                       title:
 *                         type: string
 *                         example: "생일 축하해!"
 *                       letterPaperId:
 *                         type: integer
 *                         example: 3
 *                       envelopeId:
 *                         type: integer
 *                         example: 8
 *                       envelopeImageUrl:
 *                         type: string
 *                         example: "https://cdn.mymoamoa.com/uploads/envelope_image.png"
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 size:
 *                   type: integer
 *                   example: 15
 *                 totalPages:
 *                   type: integer
 *                   example: 2
 *                 totalElements:
 *                   type: integer
 *                   example: 25
 *       400:
 *         description: 잘못된 요청 (birthdayEventId 누락 등)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const getLetters = async (req, res) => {
  try {
    const { user } = req;
    const { birthdayEventId, page = 1, size = 15 } = req.query;

    if (!user || !user.id) {
      return res.status(401).json({
        isSuccess: false,
        code: 401,
        message: '인증이 필요합니다.'
      });
    }

    if (!birthdayEventId) {
      return res.status(400).json({
        isSuccess: false,
        code: 400,
        message: 'birthdayEventId는 필수 파라미터입니다.'
      });
    }

    const pageNum = parseInt(page);
    const sizeNum = parseInt(size);

    if (pageNum < 1 || sizeNum < 1) {
      return res.status(400).json({
        isSuccess: false,
        code: 400,
        message: 'page와 size는 1 이상이어야 합니다.'
      });
    }

    const result = await letterService.getLetters(parseInt(birthdayEventId), pageNum, sizeNum);

    return res.status(200).json(result);

  } catch (error) {
    console.error('편지 목록 조회 중 오류:', error);
    
    if (error.message === '생일 이벤트를 찾을 수 없습니다.') {
      return res.status(404).json({
        isSuccess: false,
        code: 404,
        message: error.message
      });
    }

    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: '편지 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /api/letters/{id}:
 *   get:
 *     summary: 편지 상세 조회
 *     description: 특정 편지의 상세 정보를 조회합니다.
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 편지 ID
 *     responses:
 *       200:
 *         description: 편지 상세 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 33
 *                 birthdayEventId:
 *                   type: integer
 *                   example: 12
 *                 senderId:
 *                   type: integer
 *                   example: 5
 *                 receiverId:
 *                   type: integer
 *                   example: 7
 *                 content:
 *                   type: string
 *                   example: "오늘도 행복하길 바라."
 *                 letterPaperId:
 *                   type: integer
 *                   example: 3
 *                 envelopeId:
 *                   type: integer
 *                   example: 8
 *                 envelopeImageUrl:
 *                   type: string
 *                   example: "https://cdn.mymoamoa.com/uploads/envelope_image.png"
 *                 sentAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-15T12:30:00Z"
 *                 readAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 권한 없음 (편지 열람 권한 없음)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 편지를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const getLetterById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    if (!user || !user.id) {
      return res.status(401).json({
        isSuccess: false,
        code: 401,
        message: '인증이 필요합니다.'
      });
    }

    const letterId = parseInt(id);
    const letter = await letterService.getLetterById(letterId, user.id);

    return res.status(200).json(letter);

  } catch (error) {
    console.error('편지 상세 조회 중 오류:', error);
    
    if (error.message === '편지를 찾을 수 없습니다.') {
      return res.status(404).json({
        isSuccess: false,
        code: 404,
        message: error.message
      });
    }
    
    if (error.message === '편지를 열람할 권한이 없습니다.') {
      return res.status(403).json({
        isSuccess: false,
        code: 403,
        message: error.message
      });
    }

    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: '편지 상세 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * tags:
 *   name: Letters
 *   description: 편지 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LetterCreate:
 *       type: object
 *       required:
 *         - birthdayEventId
 *         - senderId
 *         - receiverId
 *         - content
 *         - letterPaperId
 *         - envelopeId
 *       properties:
 *         birthdayEventId:
 *           type: integer
 *           description: 생일 이벤트 ID
 *         senderId:
 *           type: integer
 *           description: 발신자 ID
 *         receiverId:
 *           type: integer
 *           description: 수신자 ID
 *         content:
 *           type: string
 *           maxLength: 5000
 *           description: 편지 내용
 *         letterPaperId:
 *           type: integer
 *           description: 선택한 편지지 ID
 *         envelopeId:
 *           type: integer
 *           description: 선택한 편지봉투 ID
 *         fontId:
 *           type: integer
 *           description: 선택한 폰트 ID (선택사항)
 *         envelopeImageUrl:
 *           type: string
 *           format: uri
 *           maxLength: 255
 *           description: S3에 업로드한 이미지 URL
 *     LetterResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 편지 고유번호
 *         birthdayEventId:
 *           type: integer
 *           description: 생일 이벤트 ID
 *         senderId:
 *           type: integer
 *           description: 발신자 ID
 *         receiverId:
 *           type: integer
 *           description: 수신자 ID
 *         content:
 *           type: string
 *           description: 편지 내용
 *         letterPaperId:
 *           type: integer
 *           description: 선택한 편지지 ID
 *         envelopeId:
 *           type: integer
 *           description: 선택한 편지봉투 ID
 *         fontId:
 *           type: integer
 *           description: 선택한 폰트 ID
 *         envelopeImageUrl:
 *           type: string
 *           description: 편지봉투에 표시할 이미지 URL
 *         sentAt:
 *           type: string
 *           format: date-time
 *           description: 발송 시간
 */

/**
 * @swagger
 * /api/letters:
 *   post:
 *     summary: 편지 등록
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LetterCreate'
 *     responses:
 *       201:
 *         description: 편지 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LetterResponse'
 *       400:
 *         description: 잘못된 입력 데이터
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 리소스를 찾을 수 없음
 */
const createLetter = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const letterData = req.body;

  try {
    const letter = await letterService.createLetter(userId, letterData);
    res.status(201).json(letter);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.status === 403) {
      return res.status(403).json({ message: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    throw error; // 예상하지 못한 에러는 전역 에러 핸들러로
  }
});

/**
 * @swagger
 * /api/letters/{id}:
 *   patch:
 *     summary: 편지 수정
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 편지 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *                 description: 편지 내용
 *               letterPaperId:
 *                 type: integer
 *                 description: 편지지 변경
 *               envelopeId:
 *                 type: integer
 *                 description: 편지봉투 변경
 *               fontId:
 *                 type: integer
 *                 description: 폰트 변경 (선택사항)
 *               envelopeImageUrl:
 *                 type: string
 *                 format: uri
 *                 maxLength: 255
 *                 description: 편지봉투 이미지 변경
 *     responses:
 *       200:
 *         description: 편지 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LetterResponse'
 *       400:
 *         description: 잘못된 입력 데이터
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (본인 편지가 아니거나 수정 불가 기간)
 *       404:
 *         description: 편지를 찾을 수 없음
 */
const updateLetter = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  try {
    const updatedLetter = await letterService.updateLetter(parseInt(id), userId, updateData);
    res.json(updatedLetter);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.status === 403) {
      return res.status(403).json({ message: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    throw error; // 예상하지 못한 에러는 전역 에러 핸들러로
  }
});

/**
 * @swagger
 * /api/letters/{id}:
 *   delete:
 *     summary: 편지 삭제
 *     description: 지정된 편지를 삭제합니다. 생일 전날까지만 삭제 가능합니다.
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 편지 ID
 *     responses:
 *       200:
 *         description: 편지 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 편지가 성공적으로 삭제되었습니다.
 *       400:
 *         description: 잘못된 요청 (생일 당일 이후 삭제 시도 등)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 권한 없음 (다른 사용자의 편지)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 편지를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const deleteLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    if (!user || !user.id) {
      return res.status(401).json({
        isSuccess: false,
        code: 401,
        message: '인증이 필요합니다.'
      });
    }

    const letterId = parseInt(id);
    
    await letterService.deleteLetter(letterId, user.id);

    return res.status(200).json({
      isSuccess: true,
      code: 200,
      message: '편지가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('편지 삭제 중 오류:', error);
    
    if (error.message === '편지를 찾을 수 없습니다.') {
      return res.status(404).json({
        isSuccess: false,
        code: 404,
        message: error.message
      });
    }
    
    if (error.message === '본인의 편지만 삭제할 수 있습니다.') {
      return res.status(403).json({
        isSuccess: false,
        code: 403,
        message: error.message
      });
    }
    
    if (error.message.includes('생일') || error.message.includes('삭제할 수 없습니다')) {
      return res.status(400).json({
        isSuccess: false,
        code: 400,
        message: error.message
      });
    }

    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: '편지 삭제 중 오류가 발생했습니다.'
    });
  }
};

/**
 * @swagger
 * /api/letters/user/items:
 *   get:
 *     summary: 사용자 보관함 아이템 조회 (편지 작성용)
 *     description: 편지 작성에 필요한 아이템들을 조회합니다. 쇼핑 API와 동일한 보관함을 조회합니다.
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [font, paper, seal]
 *         description: 조회할 아이템 카테고리
 *       - in: query
 *         name: num
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 조회할 아이템 개수
 *     responses:
 *       200:
 *         description: 사용자 아이템 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       holditem_no:
 *                         type: integer
 *                         description: 보유 아이템 고유번호
 *                       category:
 *                         type: string
 *                         description: 아이템 카테고리
 *                       item_no:
 *                         type: integer
 *                         description: 아이템 번호
 *                       name:
 *                         type: string
 *                         description: 아이템 이름
 *                       price:
 *                         type: integer
 *                         description: 아이템 가격
 *                       image:
 *                         type: string
 *                         description: 아이템 이미지 URL
 *                       description:
 *                         type: string
 *                         description: 아이템 설명
 *                       event:
 *                         type: boolean
 *                         description: 이벤트 아이템 여부
 *                       purchasedAt:
 *                         type: string
 *                         format: date-time
 *                         description: 구매 일시
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
const getUserItems = async (req, res) => {
  try {
    const { user } = req;
    const { category, num } = req.query;

    if (!user || !user.id) {
      return res.status(401).json({
        isSuccess: false,
        code: 401,
        message: '인증이 필요합니다.'
      });
    }

    const numValue = num ? parseInt(num) : null;
    const userItems = await letterService.getUserItemList(user.id, category, numValue);

    return res.status(200).json({
      isSuccess: true,
      code: 200,
      message: '사용자 아이템 조회 성공',
      data: {
        userItems
      }
    });

  } catch (error) {
    console.error('사용자 아이템 조회 중 오류:', error);
    
    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: '사용자 아이템 조회 중 오류가 발생했습니다.'
    });
  }
};

export const letterController = {
  getLetters,
  getLetterById,
  createLetter,
  updateLetter,
  deleteLetter,
  getUserItems
};
