import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { donationController } from '../controllers/donation.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Donations
 *     description: 기부 관련 API
 */

/**
 * @swagger
 * /api/donations/organizations:
 *   get:
 *     summary: 기부 가능한 단체 목록 조회
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: "SUCCESS"
 *                 error:
 *                   type: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     organizations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "굿네이버스"
 *                       example:
 *                         - id: 1
 *                           name: "굿네이버스"
 *                         - id: 2
 *                           name: "세이브더칠드런"
 *                         - id: 3
 *                           name: "유니세프"
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 organizations:
 *                   - id: 1
 *                     name: "굿네이버스"
 *                   - id: 2
 *                     name: "세이브더칠드런"
 *                   - id: 3
 *                     name: "유니세프"
 */
router.get('/organizations', authenticateJWT, donationController.getOrganizations);

export default router;
