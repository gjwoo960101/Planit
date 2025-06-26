import "../../styles/Calendar.css";

const Calendar = () => {
  return (
    <>
      <div className="calendar-container">
        <div className="square-div">
          <div className="month-div">
            <div className="month-div-inner">
              <span className="nav-button nav-button-left"></span>
              <h2>{"2025"}</h2>
              <h2>{"2025"}</h2>
              <h2>06</h2>
              <span className="nav-button nav-button-right"></span>
            </div>
          </div>
          <div className="week-div">
            <div className="day-div"></div>
            <div className="day-div"></div>
            <div className="day-div"></div>
            <div className="day-div"></div>
            <div className="day-div"></div>
            <div className="day-div"></div>
            <div className="day-div"></div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Calendar;
