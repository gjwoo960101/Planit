
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
 *  해당 월 1일의 요일을 반환
 *  @param year 년도 (예: 2025)
 *  @param month 월 (예: 6)
 *  @returns 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
 */
export const getMonthFirstDay = (year: number, month: number) =>{
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



const calendarSetting = (year: number, month: number) =>{
    const cellCount = getCalendarDefaultCell();
    const lastDay = getMonthLastDay(year,month);
    const firstDayIndex = getMonthFirstDay(year,month);
    const lastDayIndex = firstDayIndex + (lastDay - 1);
    let cell = [];
    for(let i = 0; i < cellCount; i++){

    }

}
calendarSetting(2025,6);