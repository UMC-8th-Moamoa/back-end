import { calendarService } from '../services/calendar.service.js';
import { catchAsync } from '../middlewares/errorHandler.js';
import { 
  CalendarRequestDTO, 
  CalendarDateRequestDTO, 
  CalendarResponseDTO, 
  CalendarDateResponseDTO 
} from '../dtos/calendar.dto.js';

class CalendarController {
  // 특정 월의 친구들 생일 정보를 달력 형태로 조회
  async getBirthdays(req, res) {
    const userId = req.user.id; // JWT에서 추출한 사용자 ID
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new CalendarRequestDTO(req.query);
    const { year, month } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const calendarData = await calendarService.getBirthdayCalendar(
      userId, 
      year, 
      month
    );

    // 응답 데이터를 DTO로 변환
    const responseDTO = new CalendarResponseDTO(calendarData);

    res.success(responseDTO.toResponse());
  }

  // 특정 날짜의 생일 및 이벤트 상세 정보 조회
  async getBirthdaysByDate(req, res) {
    const userId = req.user.id; // JWT에서 추출한 사용자 ID
    
    // 요청 데이터를 DTO로 변환 및 검증
    const requestDTO = new CalendarDateRequestDTO(req.params);
    const { date, month, day } = requestDTO.getValidatedData();

    // 서비스 레이어 호출
    const birthdayUsers = await calendarService.getBirthdaysByDate(
      userId, 
      month, 
      day
    );

    // 응답 데이터를 DTO로 변환
    const responseDTO = new CalendarDateResponseDTO(date, birthdayUsers);

    res.success(responseDTO.toResponse());
  }
}

// 인스턴스 생성 및 catchAsync 래핑
const calendarController = new CalendarController();

export default {
  getBirthdays: catchAsync(calendarController.getBirthdays),
  getBirthdaysByDate: catchAsync(calendarController.getBirthdaysByDate)
};