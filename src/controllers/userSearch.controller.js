import { userSearchService } from '../services/userSearch.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { 
  SearchUsersRequestDto, 
  SearchUsersResponseDto,
  GetSearchHistoryRequestDto,
  GetSearchHistoryResponseDto,
  DeleteSearchHistoryRequestDto,
  DeleteSearchHistoryResponseDto
} from '../dtos/userSearch.dto.js';

class UserSearchController {
  /**
   * 사용자 검색
   * GET /api/users/search
   */
  searchUsers = catchAsync(async (req, res) => {
    const currentUserId = req.user?.id;
    
    if (!currentUserId) {
      return res.status(401).error({
        errorCode: 'UNAUTHORIZED',
        reason: '사용자 인증 정보가 없습니다'
      });
    }
    
    // DTO를 사용한 요청 데이터 검증
    const requestDto = new SearchUsersRequestDto(req.query);
    const validationErrors = requestDto.validate();
    
    if (validationErrors.length > 0) {
      return res.status(400).error({
        errorCode: 'VALIDATION_ERROR',
        reason: validationErrors.join(' ')
      });
    }

    // 사용자 검색 실행
    const result = await userSearchService.searchUsers(currentUserId, requestDto.q, requestDto.limit, requestDto.page);
    
    // DTO를 사용한 응답 생성
    const responseDto = new SearchUsersResponseDto(result.users, result.pagination);
    
    res.success(responseDto);
  });

  /**
   * 검색 기록 조회
   * GET /api/users/search/history
   */
  getSearchHistory = catchAsync(async (req, res) => {
    const currentUserId = req.user.id;
    
    // DTO를 사용한 요청 데이터 검증
    const requestDto = new GetSearchHistoryRequestDto(req.query);
    const validationErrors = requestDto.validate();
    
    if (validationErrors.length > 0) {
      return res.status(400).error({
        errorCode: 'VALIDATION_ERROR',
        reason: validationErrors.join(' ')
      });
    }

    // 검색 기록 조회 실행
    const result = await userSearchService.getSearchHistory(currentUserId, requestDto.limit);
    
    // DTO를 사용한 응답 생성
    const responseDto = new GetSearchHistoryResponseDto(result.searchHistory);
    
    res.success(responseDto);
  });

  /**
   * 검색 기록 삭제
   * DELETE /api/users/search/history/{historyId}
   */
  deleteSearchHistory = catchAsync(async (req, res) => {
    const currentUserId = req.user.id;
    
    // DTO를 사용한 요청 데이터 검증
    const requestDto = new DeleteSearchHistoryRequestDto(req.params);
    const validationErrors = requestDto.validate();
    
    if (validationErrors.length > 0) {
      return res.status(400).error({
        errorCode: 'VALIDATION_ERROR',
        reason: validationErrors.join(' ')
      });
    }

    // 검색 기록 삭제 실행
    await userSearchService.deleteSearchHistory(currentUserId, requestDto.historyId);
    
    // DTO를 사용한 응답 생성
    const responseDto = new DeleteSearchHistoryResponseDto();
    
    res.success(responseDto);
  });
}

export default new UserSearchController();
