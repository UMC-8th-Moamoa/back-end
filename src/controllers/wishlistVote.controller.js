import { catchAsync } from '../middlewares/errorHandler.js';
import { wishlistVoteService } from '../services/wishlistVote.service.js';
import { 
  WishlistVoteRequestDTO,
  VotingWishlistsResponseDTO,
  VoteCompletionResponseDTO,
  VoteResultsResponseDTO
} from '../dtos/wishlistVote.dto.js';

/**
 * 위시리스트 투표 컨트롤러
 */
class WishlistVoteController {
  /**
   * 투표할 위시리스트 목록 조회
   * GET /api/birthdays/events/{eventId}/wishlist/vote
   */
  static getVotingWishlists = catchAsync(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const data = await wishlistVoteService.getVotingWishlists(parseInt(eventId), userId);
    const responseDTO = new VotingWishlistsResponseDTO(data);

    res.success(responseDTO.toResponse());
  });

  /**
   * 위시리스트 투표하기
   * POST /api/birthdays/events/{eventId}/wishlist/vote
   */
  static voteForWishlists = catchAsync(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;

    // 요청 데이터 검증
    const requestDTO = new WishlistVoteRequestDTO(req.body);
    const { wishlistIds } = requestDTO.getValidatedData();

    const result = await wishlistVoteService.voteForWishlists(
      parseInt(eventId), 
      userId, 
      wishlistIds
    );

    const responseDTO = new VoteCompletionResponseDTO(result);
    res.success(responseDTO.toResponse());
  });

  /**
   * 투표 결과 조회
   * GET /api/birthdays/events/{eventId}/wishlist/vote/results
   */
  static getVoteResults = catchAsync(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const results = await wishlistVoteService.getVoteResults(parseInt(eventId), userId);
    const responseDTO = new VoteResultsResponseDTO(results);

    res.success(responseDTO.toResponse());
  });

  /**
   * 사용자의 현재 투표 상태 조회
   * GET /api/birthdays/events/{eventId}/wishlist/vote/my-votes
   */
  static getUserVotes = catchAsync(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const userVotes = await wishlistVoteService.getUserVotes(parseInt(eventId), userId);

    res.success({
      eventId: parseInt(eventId),
      votedWishlistIds: userVotes
    });
  });
}

export default WishlistVoteController;