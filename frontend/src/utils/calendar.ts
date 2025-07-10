import { CalendarCellType } from "../types/calendarType";

/**
 * 입력한 달의 마지막날짜 반환
 * @param year 년도 (예: 2025)
 * @param month 월 (예: 6)
 * @returns 마지막 날짜 (예: 30)
 */
export const getMonthLastDay = (year: number, month: number) => {
    return new Date(year,month,0).getDate();
}

/**
 * 입력한 달의 마지막날짜 -minusNumber 반환
 * @param year 년도 (예: 2025)
 * @param month 월 (예: 6)
 * @param minusNumber 5
 * @returns 마지막 날짜 -5 (예: 25) 
 */
export const getPrevMonthLastDay = (year: number, month: number,minusNumber: number) =>{
    if(month -1 < 1){
        return new Date(year,0,0).getDate() - minusNumber;
    }
    return new Date(year,month-1,0).getDate() - minusNumber;
}

/**
 *  해당 월 1일의 요일을 반환
 *  @param year 년도 (예: 2025)
 *  @param month 월 (예: 6)
 *  @returns 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
 */
export const getMonthFirstDay = (year: number, month: number) =>{
    if(month -1 < 1){
        return new Date(year,0,0).getDay();
    }
    return new Date(year,month -1 , 1).getDay();
}

/**
 * 입력한 년,월의 마지막날짜 요일 index 반환
 * @param year 년도 (예: 2025)
 * @param month 월 (예: 6)
 * @returns 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
 */
export const getMonthLastDayIndex = (year: number, month: number) =>{
    // new Date함수의 month는 0부터 시작하므로 6을 넣으면 7월이 됨
    // ex) 2025,6,0(해당 달의 마지막날짜).getDay() => 1(월요일)
    return  new Date(year, month, 0).getDay();
}



/**
 * 캘린더의 고정된 셀 갯수 반환
 * @returns 35
 */
export const getCalendarDefaultCell = () =>{
    return 35;
}

export const getNowYearAndMonth = () =>{
    return {
        nowYear : new Date().getFullYear(),
        nowMonth : new Date().getMonth() + 1
    }
}

/**
 * 현재 날짜 정보를 반환
 * @returns 현재 년도, 월, 일
 */
export const getToday = () => {
    const date = new Date();
    
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate()
    };
}


/**
 * 캘린더 세팅 
 * @param year 년도 (예: 2025)
 * @param month 월 (예: 6)
 * @returns 캘린더 세팅 결과
 */

export const calendarSetting = (year: number, month: number): CalendarCellType[] => {
    const cellCount = getCalendarDefaultCell();
    const lastDay = getMonthLastDay(year, month);
    const firstDayIndex = getMonthFirstDay(year, month);
    const lastDayIndex = firstDayIndex + (lastDay - 1);
    const cell: CalendarCellType[] = [];
    
    for (let i = 0; i < cellCount; i++) {
        if (i < firstDayIndex) {
            // 이전달 날짜들
            const date = getPrevMonthLastDay(year, month, firstDayIndex - 1 - i);
            
            cell.push({
                isPrevMonth: true,
                isNextMonth: false,
                date: date
            });
        } else if (i <= lastDayIndex) {
            // 현재달 날짜들
            const date = i - firstDayIndex + 1;
            cell.push({
                isPrevMonth: false,
                isNextMonth: false,
                date: date
            });
        } else {
            // 다음달 날짜들
            const date = i - lastDayIndex;
            cell.push({
                isPrevMonth: false,
                isNextMonth: true,
                date: date
            });
        }
    }
    return cell;
}