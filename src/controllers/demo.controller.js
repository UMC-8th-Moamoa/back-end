import { catchAsync } from '../middlewares/errorHandler.js';
import { demoService } from '../services/demo.service.js';

/**
 * @swagger
 * tags:
 *   name: Demo
 *   description: 데모데이용 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DemoEventResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 데모 이벤트 ID
 *         userId:
 *           type: integer
 *           description: 사용자 ID
 *         shareLink:
 *           type: string
 *           description: 공유 링크 (짧은 ID)
 *         shareUrl:
 *           type: string
 *           description: 완전한 공유 URL
 *         title:
 *           type: string
 *           description: 이벤트 제목
 *         isActive:
 *           type: boolean
 *           description: 활성화 여부
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 생성일시
 *     DemoLetterCreate:
 *       type: object
 *       required:
 *         - writerName
 *         - content
 *       properties:
 *         writerName:
 *           type: string
 *           maxLength: 50
 *           description: 편지 작성자 이름
 *         content:
 *           type: string
 *           maxLength: 5000
 *           description: 편지 내용
 *     DemoLetterResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 편지 ID
 *         writerName:
 *           type: string
 *           description: 작성자 이름
 *         content:
 *           type: string
 *           description: 편지 내용
 *         isRead:
 *           type: boolean
 *           description: 읽음 여부
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 작성일시
 */

/**
 * @swagger
 * /api/demo/events:
 *   post:
 *     summary: 데모데이용 이벤트 생성 (수동호출)
 *     description: 회원가입한 사용자를 위한 데모 이벤트를 생성합니다.
 *     tags: [Demo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: 데모 이벤트 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DemoEventResponse'
 *       400:
 *         description: 이미 데모 이벤트가 존재함
 *       401:
 *         description: 인증 실패
 */
const createDemoEvent = catchAsync(async (req, res) => {
  const userId = req.user.id;

  try {
    const demoEvent = await demoService.createDemoEvent(userId);
    res.status(201).json(demoEvent);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @swagger
 * /api/demo/events/my:
 *   get:
 *     summary: 내 데모 이벤트 조회
 *     tags: [Demo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 데모 이벤트 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DemoEventResponse'
 *       404:
 *         description: 데모 이벤트를 찾을 수 없음
 */
const getMyDemoEvent = catchAsync(async (req, res) => {
  const userId = req.user.id;

  try {
    const demoEvent = await demoService.getDemoEventByUserId(userId);
    res.json(demoEvent);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @swagger
 * /api/demo/events/{shareLink}/public:
 *   get:
 *     summary: 공유 링크로 데모 이벤트 조회 (비회원 접근 가능)
 *     tags: [Demo]
 *     parameters:
 *       - in: path
 *         name: shareLink
 *         required: true
 *         schema:
 *           type: string
 *         description: 공유 링크 ID
 *     responses:
 *       200:
 *         description: 데모 이벤트 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 userName:
 *                   type: string
 *                   description: 이벤트 주인 이름
 *       404:
 *         description: 데모 이벤트를 찾을 수 없음
 */
const getDemoEventByShareLink = catchAsync(async (req, res) => {
  const { shareLink } = req.params;

  // shareLink 검증
  if (!shareLink || shareLink.trim().length === 0) {
    return res.status(400).json({
      resultType: 'FAIL',
      error: {
        errorCode: 'B002',
        reason: '입력값이 올바르지 않습니다',
        data: [{ field: 'shareLink', message: '공유 링크가 필요합니다', value: shareLink }]
      },
      success: null
    });
  }

  if (!/^[A-Za-z0-9_-]+$/.test(shareLink) || shareLink.length < 5 || shareLink.length > 20) {
    return res.status(400).json({
      resultType: 'FAIL',
      error: {
        errorCode: 'B002',
        reason: '입력값이 올바르지 않습니다',
        data: [{ field: 'shareLink', message: '올바른 공유 링크 형식이 아닙니다', value: shareLink }]
      },
      success: null
    });
  }

  try {
    const demoEvent = await demoService.getDemoEventByShareLink(shareLink);
    res.json(demoEvent);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @swagger
 * /api/demo/events/{shareLink}/letters:
 *   post:
 *     summary: 데모 편지 작성 (비회원 접근 가능)
 *     tags: [Demo]
 *     parameters:
 *       - in: path
 *         name: shareLink
 *         required: true
 *         schema:
 *           type: string
 *         description: 공유 링크 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - writerName
 *               - content
 *             properties:
 *               writerName:
 *                 type: string
 *                 maxLength: 50
 *                 description: 편지 작성자 이름
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *                 description: 편지 내용
 *     responses:
 *       201:
 *         description: 편지 작성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DemoLetterResponse'
 *       400:
 *         description: 잘못된 입력 데이터
 *       404:
 *         description: 데모 이벤트를 찾을 수 없음
 */
const createDemoLetter = catchAsync(async (req, res) => {
  const { shareLink } = req.params;
  const { writerName, content } = req.body;

  // shareLink 검증
  if (!shareLink || shareLink.trim().length === 0) {
    return res.status(400).json({
      resultType: 'FAIL',
      error: {
        errorCode: 'B002',
        reason: '입력값이 올바르지 않습니다',
        data: [{ field: 'shareLink', message: '공유 링크가 필요합니다', value: shareLink }]
      },
      success: null
    });
  }

  if (!/^[A-Za-z0-9_-]+$/.test(shareLink) || shareLink.length < 5 || shareLink.length > 20) {
    return res.status(400).json({
      resultType: 'FAIL',
      error: {
        errorCode: 'B002',
        reason: '입력값이 올바르지 않습니다',
        data: [{ field: 'shareLink', message: '올바른 공유 링크 형식이 아닙니다', value: shareLink }]
      },
      success: null
    });
  }

  // writerName 검증  
  if (!writerName || writerName.trim().length === 0) {
    return res.status(400).json({
      resultType: 'FAIL',
      error: {
        errorCode: 'B002',
        reason: '입력값이 올바르지 않습니다',
        data: [{ field: 'writerName', message: '작성자 이름이 필요합니다', value: writerName }]
      },
      success: null
    });
  }

  if (writerName.length > 10) {
    return res.status(400).json({
      resultType: 'FAIL',
      error: {
        errorCode: 'B002',
        reason: '입력값이 올바르지 않습니다',
        data: [{ field: 'writerName', message: '작성자 이름은 10자 이하로 입력해주세요', value: writerName }]
      },
      success: null
    });
  }

  // content 검증
  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      resultType: 'FAIL',
      error: {
        errorCode: 'B002',
        reason: '입력값이 올바르지 않습니다',
        data: [{ field: 'content', message: '편지 내용이 필요합니다', value: content }]
      },
      success: null
    });
  }

  if (content.length > 1000) {
    return res.status(400).json({
      resultType: 'FAIL',
      error: {
        errorCode: 'B002',
        reason: '입력값이 올바르지 않습니다',
        data: [{ field: 'content', message: '편지 내용은 1000자 이하로 입력해주세요', value: content }]
      },
      success: null
    });
  }

  try {
    console.log('Creating letter with validated data:', { shareLink, writerName, content });
    const letter = await demoService.createDemoLetter(shareLink, writerName, content);
    res.status(201).json(letter);
  } catch (error) {
    console.error('Demo letter creation error:', error);
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @swagger
 * /api/demo/letters/my:
 *   get:
 *     summary: 내 데모 편지들 조회
 *     tags: [Demo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 10
 *         description: 페이지 크기
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
 *                     $ref: '#/components/schemas/DemoLetterResponse'
 *                 page:
 *                   type: integer
 *                 size:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalElements:
 *                   type: integer
 *       404:
 *         description: 데모 이벤트를 찾을 수 없음
 */
const getMyDemoLetters = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, size = 10 } = req.query;

  try {
    const result = await demoService.getDemoLettersByUserId(userId, {
      page: parseInt(page),
      size: parseInt(size)
    });
    res.json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @swagger
 * /api/demo/letters/{id}/read:
 *   patch:
 *     summary: 편지 읽음 처리
 *     tags: [Demo]
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
 *         description: 읽음 처리 성공
 *       404:
 *         description: 편지를 찾을 수 없음
 *       403:
 *         description: 권한 없음
 */
const markDemoLetterAsRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  console.log('편지 읽음 처리 시작:', { letterId: id, userId });

  try {
    await demoService.markDemoLetterAsRead(parseInt(id), userId);
    
    // 업데이트 후 해당 편지 다시 조회해서 확인
    const updatedLetter = await demoService.getDemoLetterByIdPublic(parseInt(id));
    console.log('편지 읽음 처리 완료:', { letterId: id, isRead: updatedLetter?.isRead });
    
    res.json({ message: '편지를 읽음으로 처리했습니다.' });
  } catch (error) {
    console.error('편지 읽음 처리 실패:', error);
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.status === 403) {
      return res.status(403).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @swagger
 * /api/demo/letters/{id}:
 *   get:
 *     summary: 내 데모 이벤트에 작성된 편지 상세 조회
 *     description: 내 데모 이벤트에 작성된 편지의 상세 내용을 조회합니다. 다른 사람들이 나에게 써준 편지를 읽을 수 있습니다.
 *     tags: [Demo]
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
 *         description: 편지 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DemoLetterResponse'
 *       404:
 *         description: 편지를 찾을 수 없음
 *       403:
 *         description: 내 데모 이벤트에 작성된 편지가 아님
 */
const getDemoLetterById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const letter = await demoService.getDemoLetterById(parseInt(id), userId);
    res.json(letter);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.status === 403) {
      return res.status(403).json({ message: error.message });
    }
    throw error;
  }
});

export const demoController = {
  createDemoEvent,
  getMyDemoEvent,
  getDemoEventByShareLink,
  createDemoLetter,
  getMyDemoLetters,
  markDemoLetterAsRead,
  getDemoLetterById
};
