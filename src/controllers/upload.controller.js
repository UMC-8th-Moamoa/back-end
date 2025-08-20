import { 
  generateUserImageUploadUrl, 
  generateWishlistImageUploadUrl,
  generateShoppingImageUploadUrl,
  generateLetterEnvelopeImageUploadUrl,
  deleteS3Object,
  getFileKeyFromUrl,
  verifyUploadedFile
} from "../middlewares/s3.middleware.js";

/**
 * @swagger
 * /api/upload/user-image/upload-url:
 *   post:
 *     summary: 사용자 이미지 업로드 URL 생성
 *     description: |
 *       사용자 프로필 이미지 등을 S3에 업로드하기 위한 Presigned URL을 생성합니다.
 *       
 *       ## 사용 방법:
 *       1. 이 API로 Presigned URL을 받습니다
 *       2. 클라이언트에서 받은 URL로 직접 S3에 PUT 요청으로 파일 업로드
 *       3. (선택사항) `/api/upload/confirm` 또는 `/api/upload/verify`로 업로드 확인
 *       
 *       ## 클라이언트 업로드 예시:
 *       ```javascript
 *       const response = await fetch(uploadUrl, {
 *         method: 'PUT',
 *         headers: { 'Content-Type': fileType },
 *         body: file
 *       });
 *       ```
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: "profile.jpg"
 *               fileType:
 *                 type: string
 *                 example: "image/jpeg"
 *     responses:
 *       200:
 *         description: 업로드 URL이 성공적으로 생성됨
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
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
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: "wishlist_item.png"
 *               fileType:
 *                 type: string
 *                 example: "image/png"
 *     responses:
 *       200:
 *         description: 업로드 URL이 성공적으로 생성됨
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
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
 * /api/upload/shopping-image/upload-url:
 *   post:
 *     summary: 쇼핑 이미지 업로드 URL 생성
 *     description: 쇼핑 관련 이미지(폰트, 용지, 도장 등)를 S3에 업로드하기 위한 Presigned URL을 생성합니다.
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *               - category
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: "font_sample.jpg"
 *               fileType:
 *                 type: string
 *                 example: "image/jpeg"
 *               category:
 *                 type: string
 *                 example: "font"
 *                 enum: [font, paper, seal]
 *     responses:
 *       200:
 *         description: 업로드 URL이 성공적으로 생성됨
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
export const getShoppingImageUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, category } = req.body;
    
    if (!fileName || !fileType || !category) {
      return res.status(400).json({
        success: false,
        message: "fileName, fileType, category가 모두 필요합니다."
      });
    }

    // 카테고리 검증
    if (!['font', 'paper', 'seal'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 카테고리입니다. (font, paper, seal 중 선택)"
      });
    }

    const uploadData = await generateShoppingImageUploadUrl(fileName, fileType, category);
    
    res.status(200).json({
      success: true,
      message: "쇼핑 이미지 업로드 URL이 생성되었습니다.",
      data: uploadData
    });
  } catch (error) {
    console.error("쇼핑 이미지 업로드 URL 생성 실패:", error);
    res.status(500).json({
      success: false,
      message: "업로드 URL 생성에 실패했습니다.",
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/upload/verify:
 *   post:
 *     summary: 업로드 파일 검증
 *     description: S3에 업로드된 파일이 실제로 존재하는지 확인하고 파일 정보를 반환합니다.
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileUrl
 *             properties:
 *               fileUrl:
 *                 type: string
 *                 example: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
 *     responses:
 *       200:
 *         description: 파일 검증 완료
 *       404:
 *         description: 파일을 찾을 수 없음
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
export const verifyUpload = async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: "fileUrl이 필요합니다."
      });
    }

    const fileKey = getFileKeyFromUrl(fileUrl);
    
    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 파일 URL입니다."
      });
    }

    const verification = await verifyUploadedFile(fileKey);
    
    if (verification.exists) {
      res.status(200).json({
        success: true,
        message: "파일이 성공적으로 확인되었습니다.",
        data: verification
      });
    } else {
      res.status(404).json({
        success: false,
        message: "파일을 찾을 수 없습니다."
      });
    }
  } catch (error) {
    console.error("파일 검증 실패:", error);
    res.status(500).json({
      success: false,
      message: "파일 검증 중 오류가 발생했습니다.",
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/upload/confirm:
 *   post:
 *     summary: 업로드 완료 확인 (향상된 버전)
 *     description: |
 *       클라이언트에서 S3에 파일 업로드를 완료한 후 서버에 알려주고, 실제 파일 존재 여부를 확인합니다.
 *       데이터베이스에 파일 정보를 저장하거나 추가 처리가 필요한 경우 사용합니다.
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileUrl
 *             properties:
 *               fileUrl:
 *                 type: string
 *                 example: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
 *               fileName:
 *                 type: string
 *                 example: "profile.jpg"
 *               expectedSize:
 *                 type: integer
 *                 example: 1024000
 *     responses:
 *       200:
 *         description: 업로드 완료 확인됨
 *       404:
 *         description: 파일을 찾을 수 없음
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
export const confirmUpload = async (req, res) => {
  try {
    const { fileUrl, fileName, expectedSize } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: "fileUrl이 필요합니다."
      });
    }

    // 파일 존재 여부 및 정보 확인
    const fileKey = getFileKeyFromUrl(fileUrl);
    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 파일 URL입니다."
      });
    }

    const verification = await verifyUploadedFile(fileKey);
    
    if (!verification.exists) {
      return res.status(404).json({
        success: false,
        message: "업로드된 파일을 찾을 수 없습니다."
      });
    }

    // 파일 크기 검증 (선택사항)
    if (expectedSize && Math.abs(verification.size - expectedSize) > 1024) {
      console.warn(`파일 크기 불일치: 예상 ${expectedSize}, 실제 ${verification.size}`);
    }
    
    res.status(200).json({
      success: true,
      message: "업로드가 완료되고 확인되었습니다.",
      data: {
        fileUrl,
        fileName,
        actualSize: verification.size,
        contentType: verification.contentType,
        uploadedAt: verification.lastModified,
        verified: true
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
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 example: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/users/uuid_timestamp.jpg"
 *     responses:
 *       200:
 *         description: 이미지가 성공적으로 삭제됨
 *       400:
 *         description: 잘못된 요청 또는 유효하지 않은 URL
 *       500:
 *         description: 서버 오류 또는 삭제 실패
 */
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

// 기존 자동 업로드 방식 (호환성을 위해 유지)
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
 * /api/upload/letter-envelope/upload-url:
 *   post:
 *     summary: 모아레터 편지봉투 우표 이미지 업로드 URL 생성
 *     description: |
 *       모아레터 편지봉투에 붙일 우표 이미지를 S3에 업로드하기 위한 Presigned URL을 생성합니다.
 *       
 *       ## 업로드 폴더 구조:
 *       - **letters/envelopes/**: 편지봉투 우표 이미지 전용 폴더
 *       
 *       ## 사용 워크플로우:
 *       1. 이 API로 Presigned URL 생성 (15분 유효)
 *       2. 클라이언트에서 받은 uploadUrl로 직접 S3에 PUT 요청으로 이미지 업로드
 *       3. 편지 작성/수정 시 fileUrl을 envelopeImageUrl 필드에 사용
 *       
 *       ## 지원 파일 형식:
 *       - PNG, JPG, JPEG, BMP, GIF
 *       - 최대 파일 크기: 5MB
 *       
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: "envelope_stamp.png"
 *                 description: 업로드할 파일명 (확장자 포함)
 *               fileType:
 *                 type: string
 *                 example: "image/png"
 *                 enum:
 *                   - image/png
 *                   - image/jpeg
 *                   - image/jpg
 *                   - image/bmp
 *                   - image/gif
 *                 description: 파일의 MIME 타입
 *           examples:
 *             PNG 우표:
 *               summary: PNG 형식 우표 이미지
 *               value:
 *                 fileName: "christmas_stamp.png"
 *                 fileType: "image/png"
 *             JPG 우표:
 *               summary: JPG 형식 우표 이미지  
 *               value:
 *                 fileName: "birthday_stamp.jpg"
 *                 fileType: "image/jpeg"
 *     responses:
 *       200:
 *         description: 업로드 URL이 성공적으로 생성됨
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
 *                   example: "편지봉투 이미지 업로드 URL이 생성되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadUrl:
 *                       type: string
 *                       format: uri
 *                       description: S3 업로드용 Presigned URL (15분 유효)
 *                       example: "https://moamoas-s3.s3.amazonaws.com/letters/envelopes/550e8400-e29b-41d4-a716-446655440000_1723456789000.png?AWSAccessKeyId=..."
 *                     fileUrl:
 *                       type: string
 *                       format: uri
 *                       description: 업로드 완료 후 접근 가능한 최종 URL (편지 작성 시 사용)
 *                       example: "https://moamoas-s3.s3.ap-northeast-2.amazonaws.com/letters/envelopes/550e8400-e29b-41d4-a716-446655440000_1723456789000.png"
 *                     key:
 *                       type: string
 *                       description: S3 객체 키
 *                       example: "letters/envelopes/550e8400-e29b-41d4-a716-446655440000_1723456789000.png"
 *                     expires:
 *                       type: string
 *                       format: date-time
 *                       description: URL 만료 시간
 *                       example: "2025-08-20T15:30:00.000Z"
 *                     maxFileSize:
 *                       type: integer
 *                       description: 최대 허용 파일 크기 (바이트)
 *                       example: 5242880
 *                     contentType:
 *                       type: string
 *                       description: 업로드할 파일의 MIME 타입
 *                       example: "image/png"
 *                     method:
 *                       type: string
 *                       description: 클라이언트에서 사용할 HTTP 메서드
 *                       example: "PUT"
 *       400:
 *         description: 잘못된 요청 (필수 파라미터 누락 또는 잘못된 파일 형식)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "fileName과 fileType이 필요합니다."
 *             examples:
 *               missing_params:
 *                 summary: 필수 파라미터 누락
 *                 value:
 *                   success: false
 *                   message: "fileName과 fileType이 필요합니다."
 *               invalid_file_type:
 *                 summary: 지원하지 않는 파일 형식
 *                 value:
 *                   success: false
 *                   message: "지원하지 않는 파일 형식입니다."
 *       500:
 *         description: 서버 내부 오류 (AWS S3 연결 실패 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "업로드 URL 생성에 실패했습니다."
 *                 error:
 *                   type: string
 *                   description: 구체적인 오류 메시지
 *                   example: "AccessDenied: User is not authorized to perform s3:PutObject"
 */
// 모아레터 편지봉투 이미지 업로드 URL 생성 함수
export const getLetterEnvelopeImageUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "fileName과 fileType이 필요합니다."
      });
    }

    const uploadData = await generateLetterEnvelopeImageUploadUrl(fileName, fileType);
    
    res.status(200).json({
      success: true,
      message: "편지봉투 이미지 업로드 URL이 생성되었습니다.",
      data: uploadData
    });
  } catch (error) {
    console.error("편지봉투 이미지 업로드 URL 생성 실패:", error);
    res.status(500).json({
      success: false,
      message: "업로드 URL 생성에 실패했습니다.",
      error: error.message
    });
  }
};
