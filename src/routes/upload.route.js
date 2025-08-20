import express from "express";
import { 
  getUserImageUploadUrl,
  getWishlistImageUploadUrl,
  getShoppingImageUploadUrl,
  getLetterEnvelopeImageUploadUrl,
  deleteImage,
  confirmUpload,
  verifyUpload,
  autoUploadUserImage,
  autoUploadWishlistImage,
  autoUploadMultipleImages
} from "../controllers/upload.controller.js";
import { 
  userImageUploader, 
  wishlistImageUploader
} from "../middlewares/s3.middleware.js";

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: S3 이미지 업로드 관리 API
 *   
 * @swagger
 * components:
 *   parameters:
 *     fileName:
 *       in: body
 *       name: fileName
 *       required: true
 *       schema:
 *         type: string
 *       description: 업로드할 파일의 이름 (확장자 포함)
 *     fileType:
 *       in: body
 *       name: fileType
 *       required: true
 *       schema:
 *         type: string
 *         enum:
 *           - image/png
 *           - image/jpg
 *           - image/jpeg
 *           - image/bmp
 *           - image/gif
 *       description: 파일의 MIME 타입
 */

const router = express.Router();

// 🎯 Presigned URL 생성 API들 (권장 방식)
router.post("/user-image/upload-url", getUserImageUploadUrl);
router.post("/wishlist-image/upload-url", getWishlistImageUploadUrl); 
router.post("/shopping-image/upload-url", getShoppingImageUploadUrl);
router.post("/letter-envelope/upload-url", getLetterEnvelopeImageUploadUrl);

// 📋 업로드 검증 및 확인 API들
router.post("/verify", verifyUpload);
router.post("/confirm", confirmUpload);

// 🗑️ 이미지 삭제 API
router.delete("/image", deleteImage);

// 📤 자동 업로드 API들 (기존 방식 - 호환성 유지)
router.post("/user-image/auto", (req, res, next) => {
  userImageUploader.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: "파일 크기가 5MB를 초과했습니다."
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "파일 업로드 중 오류가 발생했습니다."
      });
    }
    next();
  });
}, autoUploadUserImage);

router.post("/wishlist-image/auto", (req, res, next) => {
  wishlistImageUploader.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: "파일 크기가 5MB를 초과했습니다."
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "파일 업로드 중 오류가 발생했습니다."
      });
    }
    next();
  });
}, autoUploadWishlistImage);

router.post("/multiple-images/auto", (req, res, next) => {
  const folder = req.query.folder; // users 또는 wishlists
  if (!folder || !['users', 'wishlists'].includes(folder)) {
    return res.status(400).json({
      success: false,
      message: "올바른 폴더를 지정해주세요. (users 또는 wishlists)"
    });
  }
  
  // 폴더에 따라 적절한 업로더 선택
  const uploader = folder === 'users' ? userImageUploader : wishlistImageUploader;
  uploader.array('images', 5)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: "파일 크기가 5MB를 초과했습니다."
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({
          success: false,
          message: "최대 5개의 파일만 업로드할 수 있습니다."
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "파일 업로드 중 오류가 발생했습니다."
      });
    }
    next();
  });
}, autoUploadMultipleImages);

export default router;
