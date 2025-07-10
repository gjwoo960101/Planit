import { TodoItem } from '../types/calendar';
import { scheduleApi, handleApiError, ScheduleData } from '../services/api';

// 데이터 저장소 인터페이스
interface LocalScheduleData {
  [dateString: string]: {
    todos: TodoItem[];
    nextTodoId: number;
  };
}

// 메모리 캐시 (성능 향상을 위해)
let scheduleData: LocalScheduleData = {};
let isDataLoaded = false;

// 로딩 상태 관리
let isLoading = false;

// 초기 데이터 로드
export const initializeStorage = async () => {
  if (isDataLoaded || isLoading) return;
  
  isLoading = true;
  try {
    const response = await scheduleApi.getAllSchedules();
    if (response.success && response.data) {
      // 서버 데이터를 로컬 형태로 변환
      scheduleData = {};
      response.data.forEach((schedule: ScheduleData) => {
        scheduleData[schedule.dateString] = {
          todos: schedule.todos,
          nextTodoId: schedule.nextTodoId
        };
      });
      isDataLoaded = true;
      
      // 데이터 로드 완료 이벤트 발생
      window.dispatchEvent(new CustomEvent('data-loaded', {
        detail: { data: scheduleData }
      }));
    } else {
      console.warn('Failed to load data from server:', response.error);
      // 서버에서 데이터를 가져올 수 없으면 빈 상태로 시작
      scheduleData = {};
      isDataLoaded = true;
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
    scheduleData = {};
    isDataLoaded = true;
  } finally {
    isLoading = false;
  }
};

// 특정 날짜의 할 일 목록 가져오기
export const getTodosFromData = async (dateString: string): Promise<TodoItem[]> => {
  if (!isDataLoaded) {
    await initializeStorage();
  }
  
  // 캐시에 있으면 반환
  if (scheduleData[dateString]) {
    return scheduleData[dateString].todos;
  }
  
  // 서버에서 해당 날짜 데이터 조회
  try {
    const response = await scheduleApi.getScheduleByDate(dateString);
    if (response.success && response.data) {
      scheduleData[dateString] = {
        todos: response.data.todos,
        nextTodoId: response.data.nextTodoId
      };
      return response.data.todos;
    }
  } catch (error) {
    console.error('Error loading todos from server:', error);
  }
  
  return [];
};

// 특정 날짜의 할 일 목록 저장하기
export const saveTodosToData = async (dateString: string, todos: TodoItem[], nextTodoId?: number) => {
  if (!isDataLoaded) {
    await initializeStorage();
  }
  
  const currentNextId = nextTodoId || getNextTodoIdFromData(dateString);
  
  try {
    const response = await scheduleApi.saveSchedule(dateString, todos, currentNextId);
    if (response.success && response.data) {
      // 캐시 업데이트
      scheduleData[dateString] = {
        todos: response.data.todos,
        nextTodoId: response.data.nextTodoId
      };
      
      // 데이터 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('data-changed', {
        detail: { dateString, todos, nextTodoId: currentNextId }
      }));
    } else {
      throw new Error(response.error || 'Failed to save todos');
    }
  } catch (error) {
    console.error('Error saving todos to server:', error);
    throw new Error(handleApiError(error instanceof Error ? error.message : 'Unknown error'));
  }
};

// 특정 날짜의 nextTodoId 가져오기
export const getNextTodoIdFromData = (dateString: string): number => {
  return scheduleData[dateString]?.nextTodoId || 0;
};

// 특정 날짜의 nextTodoId 저장하기
export const saveNextTodoIdToData = async (dateString: string, id: number) => {
  if (!scheduleData[dateString]) {
    scheduleData[dateString] = {
      todos: [],
      nextTodoId: id
    };
  } else {
    scheduleData[dateString].nextTodoId = id;
  }
  
  // 현재 todos와 함께 서버에 저장
  const currentTodos = scheduleData[dateString].todos;
  await saveTodosToData(dateString, currentTodos, id);
};

// 모든 일정 데이터 가져오기
export const getAllSchedulesFromData = async () => {
  if (!isDataLoaded) {
    await initializeStorage();
  }
  
  const allSchedules: { [dateString: string]: TodoItem[] } = {};
  
  Object.entries(scheduleData).forEach(([dateString, data]) => {
    if (data.todos.length > 0) {
      allSchedules[dateString] = data.todos;
    }
  });
  
  return allSchedules;
};

// 데이터 초기화
export const clearAllData = async () => {
  try {
    const response = await scheduleApi.clearAllSchedules();
    if (response.success) {
      scheduleData = {};
      
      // 변경사항 알림 이벤트 발생
      window.dispatchEvent(new CustomEvent('data-cleared', {
        detail: { data: {} }
      }));
    } else {
      throw new Error(response.error || 'Failed to clear data');
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    throw new Error(handleApiError(error instanceof Error ? error.message : 'Unknown error'));
  }
};

// JSON 파일에서 데이터 로드 (업로드된 파일에서)
export const loadDataFromFile = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const loadedData = JSON.parse(content);
        
        // 서버에 데이터 가져오기
        const response = await scheduleApi.importData(loadedData);
        if (response.success) {
          // 서버에서 최신 데이터 다시 로드
          isDataLoaded = false;
          await initializeStorage();
          
          // 커스텀 이벤트 발생으로 컴포넌트들에 데이터 로드 완료 알림
          window.dispatchEvent(new CustomEvent('data-loaded', {
            detail: { data: scheduleData }
          }));
          
          resolve();
        } else {
          throw new Error(response.error || 'Failed to import data');
        }
      } catch {
        reject(new Error('잘못된 JSON 파일 형식입니다.'));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
    reader.readAsText(file);
  });
};

// JSON 파일로 데이터 다운로드
export const downloadDataAsFile = async () => {
  try {
    const response = await scheduleApi.exportData();
    if (response.success && response.data) {
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `planit-schedule-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } else {
      throw new Error(response.error || 'Failed to export data');
    }
  } catch (error) {
    console.error('Error downloading data:', error);
    throw new Error(handleApiError(error instanceof Error ? error.message : 'Unknown error'));
  }
};

// 할일 완료 상태 토글
export const toggleTodoCompletion = async (dateString: string, todoIndex: number) => {
  const existingTodos = await getTodosFromData(dateString);
  
  if (existingTodos[todoIndex]) {
    existingTodos[todoIndex].completed = !existingTodos[todoIndex].completed;
    await saveTodosToData(dateString, existingTodos);
    return true;
  }
  return false;
};

// 테스트 데이터 생성 함수
export const generateTestDataToStorage = async () => {
  try {
    const response = await scheduleApi.generateTestData();
    if (response.success && response.data) {
      // 서버에서 최신 데이터 다시 로드
      isDataLoaded = false;
      await initializeStorage();
      
      // 변경사항 알림 이벤트 발생
      window.dispatchEvent(new CustomEvent('data-changed', {
        detail: { key: 'test-data-generated', dateString: 'multiple', todos: [] }
      }));
      
      return response.data.count;
    } else {
      throw new Error(response.error || 'Failed to generate test data');
    }
  } catch (error) {
    console.error('Error generating test data:', error);
    throw new Error(handleApiError(error instanceof Error ? error.message : 'Unknown error'));
  }
};

// 년도별로 일정을 그룹화하는 함수
export const getSchedulesByYearFromData = async () => {
  const allSchedules = await getAllSchedulesFromData();
  const schedulesByYear: { [year: string]: { [month: string]: { [dateString: string]: TodoItem[] } } } = {};
  
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

// 일정 개수 요약을 위한 함수
export const getScheduleSummaryFromData = async () => {
  const allSchedules = await getAllSchedulesFromData();
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

// 현재 데이터 상태 확인
export const getDataStatus = () => {
  return {
    isLoaded: isDataLoaded,
    totalDates: Object.keys(scheduleData).length,
    totalTodos: Object.values(scheduleData).reduce((total, data) => total + data.todos.length, 0)
  };
};

// 레거시 함수들 (하위 호환성을 위해 유지)
export const migrateFromLocalStorage = () => {
  // 백엔드 전환으로 인해 더 이상 localStorage 마이그레이션 불필요
  console.log('localStorage migration skipped - using backend API');
}; 