import { TodoItem } from "../types/calendar";

// localStorage 유틸리티 함수들
export const getTodosFromStorage = (date: string): TodoItem[] => {
  try {
    const stored = localStorage.getItem(`todos_${date}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveTodosToStorage = (date: string, todos: TodoItem[]) => {
  try {
    const key = `todos_${date}`;
    localStorage.setItem(key, JSON.stringify(todos));
    
    // 커스텀 이벤트 발생으로 다른 컴포넌트에 변경사항 알림
    const event = new CustomEvent('local-storage-changed', {
      detail: { key, date, todos }
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.error("Failed to save todos to localStorage:", error);
  }
};

export const getNextTodoId = (date: string): number => {
  try {
    const stored = localStorage.getItem(`nextTodoId_${date}`);
    return stored ? parseInt(stored) : 0;
  } catch {
    return 0;
  }
};

export const saveNextTodoId = (date: string, id: number) => {
  try {
    localStorage.setItem(`nextTodoId_${date}`, id.toString());
  } catch (error) {
    console.error("Failed to save next todo ID to localStorage:", error);
  }
};

// 반복 일정 처리 함수
export const processRepeatingTodos = (currentDate: string): TodoItem[] => {
  try {
    // 현재 날짜 파싱 (예: "1월 15일" -> Date 객체)
    const dateMatch = currentDate.match(/(\d+)월\s*(\d+)일/);
    if (!dateMatch) return [];

    const currentMonth = parseInt(dateMatch[1]);
    const currentDay = parseInt(dateMatch[2]);
    const currentYear = new Date().getFullYear();
    const current = new Date(currentYear, currentMonth - 1, currentDay);

    const repeatingTodos: TodoItem[] = [];

    // 지난 30일간의 할일들을 확인
    for (let i = 1; i <= 30; i++) {
      const checkDate = new Date(current);
      checkDate.setDate(checkDate.getDate() - i);

      const checkDateStr = `${
        checkDate.getMonth() + 1
      }월 ${checkDate.getDate()}일`;
      const pastTodos = getTodosFromStorage(checkDateStr);

      pastTodos.forEach((todo) => {
        if (todo.repeat !== "none") {
          let shouldRepeat = false;

          switch (todo.repeat) {
            case "daily":
              shouldRepeat = i === 1; // 바로 어제의 daily 반복
              break;
            case "weekly":
              shouldRepeat = i === 7; // 정확히 일주일 전
              break;
            case "monthly":
              shouldRepeat =
                i >= 28 && checkDate.getDate() === current.getDate();
              break;
          }

          if (shouldRepeat) {
            // 이미 같은 텍스트의 할일이 있는지 확인
            const currentTodos = getTodosFromStorage(currentDate);
            const alreadyExists = currentTodos.some(
              (existingTodo) =>
                existingTodo.text === todo.text &&
                existingTodo.category === todo.category &&
                existingTodo.repeat === todo.repeat
            );

            if (!alreadyExists) {
              repeatingTodos.push({
                ...todo,
                id: Date.now() + Math.random(), // 임시 ID
                completed: false, // 새로운 날의 할일은 미완료 상태
              });
            }
          }
        }
      });
    }

    return repeatingTodos;
  } catch (error) {
    console.error("Error processing repeating todos:", error);
    return [];
  }
};

// 시간 포맷팅 함수
export const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}시간 ${mins > 0 ? mins + "분" : ""}`;
  }
  return `${mins}분`;
}; 

// 전체 일정 관리를 위한 유틸리티 함수들
export interface SchedulesByDate {
  [dateString: string]: TodoItem[];
}

export interface ScheduleByMonth {
  [monthKey: string]: SchedulesByDate;
}

export interface ScheduleByYear {
  [year: string]: ScheduleByMonth;
}

// 모든 날짜의 일정을 가져오는 함수
export const getAllSchedules = (): SchedulesByDate => {
  const allSchedules: SchedulesByDate = {};
  
  // localStorage에서 todos_로 시작하는 모든 키를 찾아서 일정 데이터 수집
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('todos_')) {
      const dateString = key.replace('todos_', '');
      try {
        const todos = JSON.parse(localStorage.getItem(key) || '[]');
        if (todos.length > 0) {
          allSchedules[dateString] = todos;
        }
      } catch (error) {
        console.warn(`Failed to parse todos for date ${dateString}:`, error);
      }
    }
  }
  
  return allSchedules;
};

// 년도별로 일정을 그룹화하는 함수
export const getSchedulesByYear = (): ScheduleByYear => {
  const allSchedules = getAllSchedules();
  const schedulesByYear: ScheduleByYear = {};
  
  Object.entries(allSchedules).forEach(([dateString, todos]) => {
    // 날짜 문자열 파싱 (예: "1월 15일")
    const dateMatch = dateString.match(/(\d+)월\s*(\d+)일/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]);
      const day = parseInt(dateMatch[2]);
      const currentYear = new Date().getFullYear();
      
      // 현재 연도를 기준으로 년도 결정
      let year = currentYear;
      const now = new Date();
      const targetDate = new Date(currentYear, month - 1, day);
      
      // 만약 목표 날짜가 현재 날짜보다 3개월 이상 뒤라면 작년 일정으로 간주
      if (targetDate.getTime() - now.getTime() > 90 * 24 * 60 * 60 * 1000) {
        year = currentYear - 1;
      }
      // 만약 목표 날짜가 현재 날짜보다 3개월 이상 전이라면 내년 일정으로 간주
      else if (now.getTime() - targetDate.getTime() > 90 * 24 * 60 * 60 * 1000) {
        year = currentYear + 1;
      }
      
      const yearKey = year.toString();
      const monthKey = month.toString().padStart(2, '0');
      
      if (!schedulesByYear[yearKey]) {
        schedulesByYear[yearKey] = {};
      }
      if (!schedulesByYear[yearKey][monthKey]) {
        schedulesByYear[yearKey][monthKey] = {};
      }
      
      schedulesByYear[yearKey][monthKey][dateString] = todos;
    }
  });
  
  return schedulesByYear;
};

// 특정 월의 일정을 가져오는 함수
export const getSchedulesByMonth = (year: number, month: number): SchedulesByDate => {
  const schedulesByYear = getSchedulesByYear();
  const yearKey = year.toString();
  const monthKey = month.toString().padStart(2, '0');
  
  return schedulesByYear[yearKey]?.[monthKey] || {};
};

// 월 이름을 한국어로 반환하는 함수
export const getKoreanMonthName = (month: number): string => {
  return `${month}월`;
};

// 요일을 한국어로 반환하는 함수
export const getKoreanDayName = (year: number, month: number, day: number): string => {
  const date = new Date(year, month - 1, day);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
};

// 일정 개수 요약을 위한 함수
export const getScheduleSummary = (): { totalSchedules: number, completedSchedules: number, pendingSchedules: number } => {
  const allSchedules = getAllSchedules();
  let totalSchedules = 0;
  let completedSchedules = 0;
  let pendingSchedules = 0;
  
  Object.values(allSchedules).forEach(todos => {
    totalSchedules += todos.length;
    todos.forEach(todo => {
      if (todo.completed) {
        completedSchedules++;
      } else {
        pendingSchedules++;
      }
    });
  });
  
  return { totalSchedules, completedSchedules, pendingSchedules };
}; 