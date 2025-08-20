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
