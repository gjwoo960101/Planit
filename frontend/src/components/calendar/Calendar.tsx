import "../../styles/Calendar.css";
import { calendarSetting } from "../../utils/calendar";
import { CalendarCell } from "./CalendarCell";

const Calendar = () => {
  const calendarCell = calendarSetting(2025, 6);
  return (
    <>
      <div className="calendar-container">
        {/* 캘린더 컨테이너 */}
        <div className="square-div">
          <div className="calendar-header">
            <div className="month-div-inner">
              <span className="nav-button nav-button-left"></span>
              <h2>{"2025.06"}</h2>
              <span className="nav-button nav-button-right"></span>
            </div>
          </div>
          <div className="calendar-body">
            <div className="calendar-inner">
              <div className="inner-header">
                <div>{"일"}</div>
                <div>{"월"}</div>
                <div>{"화"}</div>
                <div>{"수"}</div>
                <div>{"목"}</div>
                <div>{"금"}</div>
                <div>{"토"}</div>
              </div>
              <div className="inner-body">
                {calendarCell.map((cell, index) => (
                  <CalendarCell data={cell} key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Calendar;
