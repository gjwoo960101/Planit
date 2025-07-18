import { useState, useEffect } from "react";
import "../../styles/Calendar.css";
import {
  calendarSetting,
  getNowYearAndMonth,
  getToday,
} from "../../utils/calendar";
import { CalendarCell } from "./CalendarCell";
import { CalendarModal } from "../modal/CalendarModal";
import { ScheduleMenu } from "./ScheduleMenu";
import {
  HolidayInfo,
  getKoreanHolidays,
  preloadCurrentYearHolidays,
} from "../../utils/holidays";
import { initializeStorage } from "../../utils/dataStorage";

const Calendar = () => {
  const { nowYear, nowMonth } = getNowYearAndMonth();
  const today = getToday();
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);
  const [holidays, setHolidays] = useState<HolidayInfo[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 초기 데이터 마이그레이션 및 로드
  useEffect(() => {
    // localStorage에서 JSON으로 데이터 마이그레이션
    initializeStorage();
  }, []);

  // 공휴일 데이터 로드
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        // 현재 연도와 주변 연도 공휴일 미리 로드
        await preloadCurrentYearHolidays();

        // 현재 표시 중인 연도의 공휴일 가져오기
        const yearHolidays = await getKoreanHolidays(year);
        setHolidays(yearHolidays);
      } catch (error) {
        console.warn("Failed to load holidays:", error);
      }
    };

    loadHolidays();
  }, [year]); // year가 변경될 때마다 공휴일 재로드

  const handleMonthChange = (changeMonth: number) => {
    if (changeMonth < 1) {
      setYear(year - 1);
      setMonth(12);
    } else if (changeMonth > 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(changeMonth);
    }
  };

  // 년도 변경 핸들러 추가
  const handleYearChange = (changeYear: number) => {
    setYear(changeYear);
  };

  const goToToday = () => {
    setYear(nowYear);
    setMonth(nowMonth);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const calendarCell = calendarSetting(year, month);

  return (
    <>
      {/* 메뉴 버튼 */}
      <button
        className={`menu-button ${isMenuOpen ? "active" : ""}`}
        onClick={handleMenuToggle}
        title={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
      >
        <div className="menu-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className={`calendar-container ${isMenuOpen ? "menu-open" : ""}`}>
        {/* 캘린더 컨테이너 */}
        <div className="square-div">
          <div className="calendar-header">
            <div className="month-div-inner">
              <div className="nav-section">
                {/* 년도 네비게이션 추가 */}
                <div className="year-nav">
                  <span
                    className="nav-button nav-button-year-left"
                    onClick={() => handleYearChange(year - 1)}
                    title="이전 년도"
                  ></span>
                </div>

                <span
                  className="nav-button nav-button-left"
                  onClick={() => handleMonthChange(month - 1)}
                  title="이전 달"
                ></span>

                <div className="date-display-container">
                  {/* 년월 표시 */}
                  <div className="date-display">
                    <span className="year-display">{year}년</span>
                    <span className="month-display">{month}월</span>
                  </div>
                </div>

                <span
                  className="nav-button nav-button-right"
                  onClick={() => handleMonthChange(month + 1)}
                  title="다음 달"
                ></span>

                {/* 년도 네비게이션 추가 */}
                <div className="year-nav">
                  <span
                    className="nav-button nav-button-year-right"
                    onClick={() => handleYearChange(year + 1)}
                    title="다음 년도"
                  ></span>
                </div>
              </div>
              <div className="today-section">
                {(year !== nowYear || month !== nowMonth) && (
                  <button
                    className="today-button"
                    onClick={goToToday}
                    title="오늘로 이동"
                  >
                    오늘
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="calendar-body">
            <div className="calendar-inner">
              <div className="inner-header">
                <div>일</div>
                <div>월</div>
                <div>화</div>
                <div>수</div>
                <div>목</div>
                <div>금</div>
                <div>토</div>
              </div>
              <div className="inner-body">
                {calendarCell.map((cell, index) => (
                  <CalendarCell
                    data={cell}
                    currentMonth={month}
                    currentYear={year}
                    today={today}
                    holidays={holidays}
                    key={`${year}-${month}-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 스케줄 메뉴 */}
      <ScheduleMenu isOpen={isMenuOpen} onClose={handleMenuClose} />

      <CalendarModal />
    </>
  );
};

export default Calendar;
