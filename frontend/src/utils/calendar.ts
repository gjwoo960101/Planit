
// 입력한 달의 마지막날짜 return
export const getMonthLastDay = (year: number, month: number) => {
    return new Date(year,month,0).getDate();
}
