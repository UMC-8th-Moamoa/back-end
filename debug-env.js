// AWS 환경변수 디버깅용 엔드포인트
import express from 'express';

const router = express.Router();

router.get('/debug-aws', (req, res) => {
  const debug = {
    AWS_REGION: process.env.AWS_REGION || 'undefined',
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY ? `${process.env.AWS_ACCESS_KEY.substring(0, 10)}...` : 'undefined',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 10)}...` : 'undefined',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'exists' : 'undefined',
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'undefined'
  };
  
  res.json(debug);
});

export default router;
