import { useState } from "react";
import "../../styles/Calendar.css";
import { calendarSetting, getNowYearAndMonth } from "../../utils/calendar";
import { CalendarCell } from "./CalendarCell";
import { CalendarModal } from "../modal/CalendarModal";

const Calendar = () => {
  const { nowYear, nowMonth } = getNowYearAndMonth();
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);

  // const handleYearChange = (changeYear: number) => {
  //   setYear(year + changeYear);
  // };

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

  const calendarCell = calendarSetting(year, month);

  return (
    <>
      <div className="calendar-container">
        {/* 캘린더 컨테이너 */}
        <div className="square-div">
          <div className="calendar-header">
            <div className="month-div-inner">
              <span
                className="nav-button nav-button-left"
                onClick={() => handleMonthChange(month - 1)}
                title="이전 달"
              ></span>
              <h2>
                {year}년 {month}월
              </h2>
              <span
                className="nav-button nav-button-right"
                onClick={() => handleMonthChange(month + 1)}
                title="다음 달"
              ></span>
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
                    key={`${year}-${month}-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CalendarModal />
    </>
  );
};

export default Calendar;
