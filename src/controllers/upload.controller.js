import { 
  generateUserImageUploadUrl, 
  generateWishlistImageUploadUrl,
  generateShoppingImageUploadUrl,
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