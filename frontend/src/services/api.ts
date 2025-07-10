import axios, { AxiosResponse, AxiosError } from 'axios';
import { TodoItem } from '../types/calendar';

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (필요시 인증 토큰 추가 등)
apiClient.interceptors.request.use(
  (config) => {
    // 요청 전 처리 (예: 로그, 인증 토큰 추가 등)
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 성공 응답 처리
    return response;
  },
  (error: AxiosError) => {
    // 에러 응답 처리
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// API 응답 타입 정의
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ScheduleData {
  id: string;
  dateString: string;
  todos: TodoItem[];
  nextTodoId: number;
  createdAt: string;
  updatedAt: string;
}

// HTTP 요청 헬퍼 함수
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  data?: unknown
): Promise<ApiResponse<T>> {
  try {
    let response: AxiosResponse<ApiResponse<T>>;

    switch (method) {
      case 'GET':
        response = await apiClient.get(endpoint);
        break;
      case 'POST':
        response = await apiClient.post(endpoint, data);
        break;
      case 'PUT':
        response = await apiClient.put(endpoint, data);
        break;
      case 'DELETE':
        response = await apiClient.delete(endpoint);
        break;
      case 'PATCH':
        response = await apiClient.patch(endpoint, data);
        break;
    }

    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<T>>;
      
      // 서버에서 반환한 에러 메시지가 있으면 사용
      if (axiosError.response?.data?.error) {
        return {
          success: false,
          error: axiosError.response.data.error,
        };
      }
      
      // HTTP 상태 코드에 따른 에러 메시지
      if (axiosError.response?.status) {
        const status = axiosError.response.status;
        let errorMessage = `HTTP ${status}`;
        
        switch (status) {
          case 400:
            errorMessage = '잘못된 요청입니다.';
            break;
          case 401:
            errorMessage = '인증이 필요합니다.';
            break;
          case 403:
            errorMessage = '접근 권한이 없습니다.';
            break;
          case 404:
            errorMessage = '요청한 리소스를 찾을 수 없습니다.';
            break;
          case 500:
            errorMessage = '서버 내부 오류가 발생했습니다.';
            break;
          case 503:
            errorMessage = '서비스를 사용할 수 없습니다.';
            break;
          default:
            errorMessage = `HTTP ${status} 오류가 발생했습니다.`;
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }
      
      // 네트워크 오류
      if (axiosError.code === 'ECONNABORTED') {
        return {
          success: false,
          error: '요청 시간이 초과되었습니다.',
        };
      }
      
      if (axiosError.code === 'ERR_NETWORK') {
        return {
          success: false,
          error: '네트워크 연결을 확인해주세요.',
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

// 일정 관련 API 함수들
export const scheduleApi = {
  // 모든 일정 조회
  async getAllSchedules(): Promise<ApiResponse<ScheduleData[]>> {
    return apiRequest<ScheduleData[]>('/schedules', 'GET');
  },

  // 특정 날짜의 일정 조회
  async getScheduleByDate(dateString: string): Promise<ApiResponse<ScheduleData>> {
    return apiRequest<ScheduleData>(`/schedules/${encodeURIComponent(dateString)}`, 'GET');
  },

  // 일정 생성 또는 업데이트
  async saveSchedule(
    dateString: string,
    todos: TodoItem[],
    nextTodoId: number
  ): Promise<ApiResponse<ScheduleData>> {
    return apiRequest<ScheduleData>('/schedules', 'POST', {
      dateString,
      todos,
      nextTodoId,
    });
  },

  // 일정 삭제
  async deleteSchedule(dateString: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/schedules/${encodeURIComponent(dateString)}`, 'DELETE');
  },

  // 특정 할 일 항목 업데이트
  async updateTodo(
    dateString: string,
    todoId: number,
    updates: Partial<TodoItem>
  ): Promise<ApiResponse<ScheduleData>> {
    return apiRequest<ScheduleData>(`/schedules/${encodeURIComponent(dateString)}/todos/${todoId}`, 'PUT', updates);
  },

  // 특정 할 일 항목 삭제
  async deleteTodo(
    dateString: string,
    todoId: number
  ): Promise<ApiResponse<ScheduleData>> {
    return apiRequest<ScheduleData>(`/schedules/${encodeURIComponent(dateString)}/todos/${todoId}`, 'DELETE');
  },

  // 할 일 완료 상태 토글
  async toggleTodoCompletion(
    dateString: string,
    todoId: number
  ): Promise<ApiResponse<ScheduleData>> {
    return apiRequest<ScheduleData>(`/schedules/${encodeURIComponent(dateString)}/todos/${todoId}/toggle`, 'PATCH');
  },

  // 모든 일정 데이터 삭제
  async clearAllSchedules(): Promise<ApiResponse<void>> {
    return apiRequest<void>('/schedules', 'DELETE');
  },

  // 테스트 데이터 생성
  async generateTestData(): Promise<ApiResponse<{ count: number }>> {
    return apiRequest<{ count: number }>('/schedules/test-data', 'POST');
  },

  // 백업 데이터 내보내기
  async exportData(): Promise<ApiResponse<ScheduleData[]>> {
    return apiRequest<ScheduleData[]>('/schedules/export', 'GET');
  },

  // 백업 데이터 가져오기
  async importData(data: ScheduleData[]): Promise<ApiResponse<{ imported: number }>> {
    return apiRequest<{ imported: number }>('/schedules/import', 'POST', { schedules: data });
  },
};

// 에러 핸들링 헬퍼
export const handleApiError = (error: string | undefined): string => {
  if (!error) return '알 수 없는 오류가 발생했습니다.';
  
  if (error.includes('fetch')) {
    return '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
  }
  
  if (error.includes('404')) {
    return '요청한 데이터를 찾을 수 없습니다.';
  }
  
  if (error.includes('500')) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  
  return error;
};

export type { ApiResponse, ScheduleData }; 