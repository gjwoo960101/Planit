// 한국 공휴일 데이터 관리 유틸리티

export interface HolidayInfo {
  date: string;
  name: string;
  holiday: boolean;
  remarks: string | null;
  kind: number;
  time: string | null;
  sunLng: number | null;
}

// 공휴일 캐시 (메모리에 저장)
const holidayCache = new Map<number, HolidayInfo[]>();

/**
 * 특정 연도의 한국 공휴일 데이터를 가져옵니다
 * @param year 연도
 * @returns 공휴일 배열
 */
export const getKoreanHolidays = async (year: number): Promise<HolidayInfo[]> => {
  // 캐시에서 확인
  if (holidayCache.has(year)) {
    return holidayCache.get(year)!;
  }

  try {
    const response = await fetch(`https://holidays.dist.be/${year}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch holidays for year ${year}`);
    }
    
    const holidays: HolidayInfo[] = await response.json();
    
    // 공휴일만 필터링 (holiday: true)
    const publicHolidays = holidays.filter(holiday => holiday.holiday);
    
    // 캐시에 저장
    holidayCache.set(year, publicHolidays);
    
    return publicHolidays;
  } catch (error) {
    console.warn(`Failed to fetch Korean holidays for ${year}:`, error);
    
    // 기본 한국 공휴일 (fallback)
    const fallbackHolidays: HolidayInfo[] = [
      { date: `${year}-01-01`, name: '신정', holiday: true, remarks: null, kind: 1, time: null, sunLng: null },
      { date: `${year}-03-01`, name: '3·1절', holiday: true, remarks: null, kind: 1, time: null, sunLng: null },
      { date: `${year}-05-05`, name: '어린이날', holiday: true, remarks: null, kind: 1, time: null, sunLng: null },
      { date: `${year}-06-06`, name: '현충일', holiday: true, remarks: null, kind: 1, time: null, sunLng: null },
      { date: `${year}-08-15`, name: '광복절', holiday: true, remarks: null, kind: 1, time: null, sunLng: null },
      { date: `${year}-10-03`, name: '개천절', holiday: true, remarks: null, kind: 1, time: null, sunLng: null },
      { date: `${year}-10-09`, name: '한글날', holiday: true, remarks: null, kind: 1, time: null, sunLng: null },
      { date: `${year}-12-25`, name: '크리스마스', holiday: true, remarks: null, kind: 1, time: null, sunLng: null },
    ];
    
    holidayCache.set(year, fallbackHolidays);
    return fallbackHolidays;
  }
};

/**
 * 특정 날짜가 공휴일인지 확인합니다
 * @param year 연도
 * @param month 월 (1-12)
 * @param date 일
 * @returns 공휴일 정보 또는 null
 */
export const isKoreanHoliday = async (
  year: number, 
  month: number, 
  date: number
): Promise<HolidayInfo | null> => {
  const holidays = await getKoreanHolidays(year);
  const dateString = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
  
  return holidays.find(holiday => holiday.date === dateString) || null;
};

/**
 * 여러 연도의 공휴일을 미리 로드합니다
 * @param years 연도 배열
 */
export const preloadHolidays = async (years: number[]): Promise<void> => {
  const promises = years.map(year => getKoreanHolidays(year));
  await Promise.all(promises);
};

/**
 * 현재 연도와 주변 연도의 공휴일을 미리 로드합니다
 */
export const preloadCurrentYearHolidays = async (): Promise<void> => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  await preloadHolidays(years);
}; 