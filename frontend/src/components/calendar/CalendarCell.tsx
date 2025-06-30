import { CalendarCellType } from "../../types/calendarType";

interface CalendarCellProps {
    data: CalendarCellType;
}

export const CalendarCell = ({ data }: CalendarCellProps) => {
    const stateClass = data.isPrevMonth ? 'prev-month' : 
                      data.isNextMonth ? 'next-month' : 'current-month';

    return (
        <div className={`day-div ${stateClass}`}>
            {data.date}
        </div>
    );
};