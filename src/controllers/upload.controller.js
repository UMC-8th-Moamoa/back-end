import { 
  generateUserImageUploadUrl, 
  generateWishlistImageUploadUrl,
  deleteS3Object,
  getFileKeyFromUrl 
} from "../middlewares/s3.middleware.js";

/**
 * @swagger
 * /api/upload/user-image/auto:
 *   post:
 *     tags:
 *       - 이미지 업로드
 *     summary: 사용자 이미지 자동 업로드
 *     description: 파일을 받아서 자동으로 S3에 업로드하고 URL을 반환합니다.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: 업로드할 이미지 파일
 *     responses:
 *       200:
 *         description: 업로드 성공
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             message:
 *               type: string
 *               example: "이미지가 성공적으로 업로드되었습니다."
 *             data:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   example: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
 *                 fileName:
 *                   type: string
 *                   example: "profile.jpg"
 *                 fileSize:
 *                   type: number
 *                   example: 1024000
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 잘못된 요청
 *       413:
 *         description: 파일 크기 초과
 *       500:
 *         description: 서버 오류
 */
export const autoUploadUserImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "이미지 파일이 필요합니다."
      });
    }

    res.status(200).json({
      success: true,
      message: "이미지가 성공적으로 업로드되었습니다.",
      data: {
        imageUrl: req.file.location,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        key: req.file.key,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error("사용자 이미지 자동 업로드 실패:", error);
    res.status(500).json({
      success: false,
      message: "이미지 업로드에 실패했습니다.",
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/upload/wishlist-image/auto:
 *   post:
 *     tags:
 *       - 이미지 업로드
 *     summary: 위시리스트 이미지 자동 업로드
 *     description: 파일을 받아서 자동으로 S3에 업로드하고 URL을 반환합니다.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: 업로드할 이미지 파일
 *     responses:
 *       200:
 *         description: 업로드 성공
 *       400:
 *         description: 잘못된 요청
 *       413:
 *         description: 파일 크기 초과
 *       500:
 *         description: 서버 오류
 */
export const autoUploadWishlistImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "이미지 파일이 필요합니다."
      });
    }

    res.status(200).json({
      success: true,
      message: "위시리스트 이미지가 성공적으로 업로드되었습니다.",
      data: {
        imageUrl: req.file.location,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        key: req.file.key,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error("위시리스트 이미지 자동 업로드 실패:", error);
    res.status(500).json({
      success: false,
      message: "이미지 업로드에 실패했습니다.",
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/upload/multiple-images/auto:
 *   post:
 *     tags:
 *       - 이미지 업로드
 *     summary: 다중 이미지 자동 업로드
 *     description: 여러 파일을 받아서 자동으로 S3에 업로드하고 URL 목록을 반환합니다.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: images
 *         type: file
 *         required: true
 *         description: 업로드할 이미지 파일들 (최대 5개)
 *       - in: query
 *         name: folder
 *         type: string
 *         required: true
 *         enum: [users, wishlists]
 *         description: 업로드할 폴더 (users 또는 wishlists)
 *     responses:
 *       200:
 *         description: 업로드 성공
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             message:
 *               type: string
 *               example: "이미지들이 성공적으로 업로드되었습니다."
 *             data:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       imageUrl:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       fileSize:
 *                         type: number
 *                 totalCount:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
export const autoUploadMultipleImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "이미지 파일들이 필요합니다."
      });
    }

    const images = req.files.map(file => ({
      imageUrl: file.location,
      fileName: file.originalname,
      fileSize: file.size,
      key: file.key
    }));

    res.status(200).json({
      success: true,
      message: `${req.files.length}개의 이미지가 성공적으로 업로드되었습니다.`,
      data: {
        images,
        totalCount: req.files.length,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error("다중 이미지 자동 업로드 실패:", error);
    res.status(500).json({
      success: false,
      message: "이미지 업로드에 실패했습니다.",
      error: error.message
    });
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadUrlRequest:
 *       type: object
 *       required:
 *         - fileName
 *         - fileType
 *       properties:
 *         fileName:
 *           type: string
 *           description: 업로드할 파일 이름
 *           example: "profile.jpg"
 *         fileType:
 *           type: string
 *           description: 파일의 MIME 타입
 *           example: "image/jpeg"
 *           enum:
 *             - image/png
 *             - image/jpg
 *             - image/jpeg
 *             - image/bmp
 *             - image/gif
 *     
 *     UploadUrlResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "업로드 URL이 생성되었습니다."
 *         data:
 *           type: object
 *           properties:
 *             uploadUrl:
 *               type: string
 *               description: S3 업로드용 Presigned URL
 *               example: "https://moamoas-s3.s3.amazonaws.com/users/uuid_timestamp.jpg?AWSAccessKeyId=..."
 *             fileUrl:
 *               type: string
 *               description: 업로드 후 파일에 접근할 수 있는 URL
 *               example: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
 *             key:
 *               type: string
 *               description: S3 객체 키
 *               example: "users/uuid_timestamp.jpg"
 *             expires:
 *               type: string
 *               format: date-time
 *               description: URL 만료 시간
 *               example: "2025-08-12T10:30:00.000Z"
 * 
 *     DeleteImageRequest:
 *       type: object
 *       required:
 *         - imageUrl
 *       properties:
 *         imageUrl:
 *           type: string
 *           description: 삭제할 이미지의 S3 URL
 *           example: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
 * 
 *     ConfirmUploadRequest:
 *       type: object
 *       required:
 *         - fileUrl
 *         - fileName
 *       properties:
 *         fileUrl:
 *           type: string
 *           description: 업로드된 파일의 URL
 *           example: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
 *         fileName:
 *           type: string
 *           description: 파일 이름
 *           example: "profile.jpg"
 *         fileSize:
 *           type: integer
 *           description: 파일 크기 (bytes)
 *           example: 1024000
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "오류가 발생했습니다."
 *         error:
 *           type: string
 *           example: "상세 오류 메시지"
 */

/**
 * @swagger
 * /api/upload/user-image/upload-url:
 *   post:
 *     summary: 사용자 이미지 업로드 URL 생성
 *     description: 사용자 프로필 이미지 등을 S3에 업로드하기 위한 Presigned URL을 생성합니다.
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UploadUrlRequest'
 *           examples:
 *             profileImage:
 *               summary: 프로필 이미지
 *               value:
 *                 fileName: "profile.jpg"
 *                 fileType: "image/jpeg"
 *             avatarImage:
 *               summary: 아바타 이미지
 *               value:
 *                 fileName: "avatar.png"
 *                 fileType: "image/png"
 *     responses:
 *       200:
 *         description: 업로드 URL이 성공적으로 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadUrlResponse'
 *       400:
 *         description: 잘못된 요청 (파라미터 누락 또는 지원하지 않는 파일 형식)
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

// 사용자 이미지 업로드 URL 생성
export const getUserImageUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "fileName과 fileType이 필요합니다."
      });
    }

    const uploadData = await generateUserImageUploadUrl(fileName, fileType);
    
    res.status(200).json({
      success: true,
      message: "사용자 이미지 업로드 URL이 생성되었습니다.",
      data: uploadData
    });
  } catch (error) {
    console.error("사용자 이미지 업로드 URL 생성 실패:", error);
    res.status(500).json({
      success: false,
      message: "업로드 URL 생성에 실패했습니다.",
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/upload/wishlist-image/upload-url:
 *   post:
 *     summary: 위시리스트 이미지 업로드 URL 생성
 *     description: 위시리스트 아이템 이미지를 S3에 업로드하기 위한 Presigned URL을 생성합니다.
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UploadUrlRequest'
 *           examples:
 *             wishlistItem:
 *               summary: 위시리스트 아이템
 *               value:
 *                 fileName: "gift_item.jpg"
 *                 fileType: "image/jpeg"
 *             productImage:
 *               summary: 상품 이미지
 *               value:
 *                 fileName: "product.png"
 *                 fileType: "image/png"
 *     responses:
 *       200:
 *         description: 업로드 URL이 성공적으로 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadUrlResponse'
 *       400:
 *         description: 잘못된 요청
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

// 위시리스트 이미지 업로드 URL 생성
export const getWishlistImageUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "fileName과 fileType이 필요합니다."
      });
    }

    const uploadData = await generateWishlistImageUploadUrl(fileName, fileType);
    
    res.status(200).json({
      success: true,
      message: "위시리스트 이미지 업로드 URL이 생성되었습니다.",
      data: uploadData
    });
  } catch (error) {
    console.error("위시리스트 이미지 업로드 URL 생성 실패:", error);
    res.status(500).json({
      success: false,
      message: "업로드 URL 생성에 실패했습니다.",
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/upload/image:
 *   delete:
 *     summary: 이미지 삭제
 *     description: S3에 업로드된 이미지를 삭제합니다.
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteImageRequest'
 *           examples:
 *             userImage:
 *               summary: 사용자 이미지 삭제
 *               value:
 *                 imageUrl: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
 *             wishlistImage:
 *               summary: 위시리스트 이미지 삭제
 *               value:
 *                 imageUrl: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/wishlists/uuid_timestamp.png"
 *     responses:
 *       200:
 *         description: 이미지가 성공적으로 삭제됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "이미지가 성공적으로 삭제되었습니다."
 *       400:
 *         description: 잘못된 요청 또는 유효하지 않은 URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 서버 오류 또는 삭제 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// 이미지 삭제
export const deleteImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "imageUrl이 필요합니다."
      });
    }

    const fileKey = getFileKeyFromUrl(imageUrl);
    
    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 이미지 URL입니다."
      });
    }

    const deleted = await deleteS3Object(fileKey);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: "이미지가 성공적으로 삭제되었습니다."
      });
    } else {
      res.status(500).json({
        success: false,
        message: "이미지 삭제에 실패했습니다."
      });
    }
  } catch (error) {
    console.error("이미지 삭제 실패:", error);
    res.status(500).json({
      success: false,
      message: "이미지 삭제 중 오류가 발생했습니다.",
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/upload/confirm:
 *   post:
 *     summary: 업로드 완료 확인
 *     description: 클라이언트에서 S3에 파일 업로드를 완료한 후 서버에 알려주는 선택적 엔드포인트입니다. 업로드 로그 기록이나 데이터베이스 업데이트 등의 후처리 작업에 사용할 수 있습니다.
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmUploadRequest'
 *           examples:
 *             profileUploadComplete:
 *               summary: 프로필 이미지 업로드 완료
 *               value:
 *                 fileUrl: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
 *                 fileName: "profile.jpg"
 *                 fileSize: 1024000
 *             wishlistUploadComplete:
 *               summary: 위시리스트 이미지 업로드 완료
 *               value:
 *                 fileUrl: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/wishlists/uuid_timestamp.png"
 *                 fileName: "gift_item.png"
 *                 fileSize: 2048000
 *     responses:
 *       200:
 *         description: 업로드 완료 확인됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "업로드가 완료되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileUrl:
 *                       type: string
 *                       example: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
 *                     fileName:
 *                       type: string
 *                       example: "profile.jpg"
 *                     fileSize:
 *                       type: integer
 *                       example: 1024000
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-12T10:30:00.000Z"
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// 업로드 완료 확인 (선택사항)
export const confirmUpload = async (req, res) => {
  try {
    const { fileUrl, fileName, fileSize } = req.body;
    
    // 여기서 데이터베이스에 파일 정보를 저장하거나
    // 추가적인 처리를 수행할 수 있습니다.
    
    res.status(200).json({
      success: true,
      message: "업로드가 완료되었습니다.",
      data: {
        fileUrl,
        fileName,
        fileSize,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error("업로드 완료 처리 실패:", error);
    res.status(500).json({
      success: false,
      message: "업로드 완료 처리 중 오류가 발생했습니다.",
      error: error.message
    });
  }
};
