import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// AWS SDK 설정
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

// 확장자 검사 목록
const allowedExtensions = [".png", ".jpg", ".jpeg", ".bmp", ".gif"];
const allowedMimeTypes = ["image/png", "image/jpg", "image/jpeg", "image/bmp", "image/gif"];

// MIME 타입 검증 함수
export const validateFileType = (fileName, mimeType) => {
  const extension = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(extension) && allowedMimeTypes.includes(mimeType);
};

// Presigned URL 생성 함수 - 업로드용
export const generatePresignedUploadUrl = async (folderName, fileName, fileType) => {
  try {
    // 파일 확장자 및 MIME 타입 검증
    if (!validateFileType(fileName, fileType)) {
      throw new Error("지원하지 않는 파일 형식입니다.");
    }

    const uuid = uuidv4();
    const extension = path.extname(fileName);
    const key = `${folderName}/${uuid}_${Date.now()}${extension}`;
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: 300, // 5분간 유효
      ACL: "public-read",
      // Conditions는 getSignedUrlPromise에서 지원하지 않으므로 제거
    };

    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
      expires: new Date(Date.now() + 5 * 60 * 1000), // 5분 후 만료
    };
  } catch (error) {
    console.error("Presigned URL 생성 실패:", error);
    throw error;
  }
};

// 사용자 이미지용 Presigned URL 생성
export const generateUserImageUploadUrl = async (fileName, fileType) => {
  return await generatePresignedUploadUrl("users", fileName, fileType);
};

// 위시리스트 이미지용 Presigned URL 생성
export const generateWishlistImageUploadUrl = async (fileName, fileType) => {
  return await generatePresignedUploadUrl("wishlists", fileName, fileType);
};

// Shopping 아이템용 Presigned URL 생성
export const generateShoppingImageUploadUrl = async (fileName, fileType, category) => {
  return await generatePresignedUploadUrl(`shopping/${category}`, fileName, fileType);
};

// S3 업로더 팩토리 함수 - 폴더별로 구분하여 생성
const createS3Uploader = (folderName) => {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const uuid = uuidv4();
        
        // 확장자 검사
        if (!allowedExtensions.includes(extension.toLowerCase())) {
          return cb(new Error("지원하지 않는 파일 확장자입니다."));
        }
        
        // 폴더별로 파일 경로 설정
        const fileName = `${uuid}_${Date.now()}${extension}`;
        cb(null, `${folderName}/${fileName}`);
      }
    }),
    limits: { 
      fileSize: 5 * 1024 * 1024, // 5MB 제한
      files: 5 // 최대 파일 개수
    },
    fileFilter: function (req, file, cb) {
      // MIME 타입 검사
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('지원하지 않는 파일 형식입니다.'));
      }
    }
  });
};

// users 폴더용 업로더 (기존 방식)
export const userImageUploader = createS3Uploader("users");

// wishlists 폴더용 업로더 (기존 방식)
export const wishlistImageUploader = createS3Uploader("wishlists");

// 기존 호환성을 위한 기본 업로더 (deprecated)
export const imageUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uploadDirectory = req.query.directory ?? "uploads";
      const extension = path.extname(file.originalname);
      const uuid = uuidv4();
      
      if (!allowedExtensions.includes(extension.toLowerCase())) {
        return cb(new Error("지원하지 않는 파일 확장자입니다."));
      }
      
      cb(null, `${uploadDirectory}/${uuid}_${file.originalname}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

// S3에서 파일 삭제 함수
export const deleteS3Object = async (fileKey) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    };
    
    await s3.deleteObject(params).promise();
    console.log(`S3 파일 삭제 성공: ${fileKey}`);
    return true;
  } catch (error) {
    console.error(`S3 파일 삭제 실패: ${fileKey}`, error);
    return false;
  }
};

// S3 URL에서 파일 키 추출 함수
export const getFileKeyFromUrl = (url) => {
  if (!url) return null;
  
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const baseUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
  
  if (url.startsWith(baseUrl)) {
    return url.replace(baseUrl, "");
  }
  
  return null;
};