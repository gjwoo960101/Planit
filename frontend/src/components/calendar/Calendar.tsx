import { useState } from "react";
import "../../styles/Calendar.css";
import { calendarSetting, getNowYearAndMonth } from "../../utils/calendar";
import { CalendarCell } from "./CalendarCell";

const Calendar = () => {
  const {nowYear,nowMonth} = getNowYearAndMonth();
  const [year,setYear] = useState(nowYear);
  const [month,setMonth] = useState(nowMonth);

  const handleYearChange = (changeYear : number) =>{
    setYear(year + changeYear);
  }
  const handleMonthChange = (changeMonth : number) =>{
    if(changeMonth < 1){
      setYear(year - 1);
      setMonth(12);
    }else if(changeMonth > 12){
      setYear(year + 1);
      setMonth(1);
    }else{
      setMonth(changeMonth);
    }
  }

  
  const calendarCell = calendarSetting(year, month);
  return (
    <>
      <div className="calendar-container">
        {/* 캘린더 컨테이너 */}
        <div className="square-div">
          <div className="calendar-header">
            <div className="month-div-inner">
              <span className="nav-button nav-button-left" onClick={()=>handleMonthChange(month-1)}></span>
              <h2>{year+"."+month}</h2>
              <span className="nav-button nav-button-right" onClick={()=>handleMonthChange(month+1)}></span>
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
