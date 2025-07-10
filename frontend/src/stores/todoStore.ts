import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { TodoItem } from '../types/calendar';
import { scheduleApi } from '../services/api';

// 일정 데이터 타입
interface ScheduleData {
  todos: TodoItem[];
  nextTodoId: number;
  lastModified: Date;
  isModified: boolean; // 서버와 동기화 필요 여부
}

// 전역 상태 타입
interface TodoStore {
  // 상태
  schedules: { [dateString: string]: ScheduleData };
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingSyncs: Set<string>; // 동기화 대기 중인 날짜들
  
  // 액션
  // 데이터 로드
  initializeStore: () => Promise<void>;
  loadScheduleFromServer: (dateString: string) => Promise<void>;
  
  // 즉시 UI 업데이트 (낙관적 업데이트)
  toggleTodoCompletion: (dateString: string, todoId: number) => void;
  updateTodoText: (dateString: string, todoId: number, text: string) => void;
  addTodo: (dateString: string, todo: Omit<TodoItem, 'id'>) => void;
  deleteTodo: (dateString: string, todoId: number) => void;
  reorderTodos: (dateString: string, todos: TodoItem[]) => void;
  
  // 백그라운드 동기화
  syncToServer: (dateString: string) => Promise<void>;
  syncAllPending: () => Promise<void>;
  
  // 유틸리티
  getTodos: (dateString: string) => TodoItem[];
  getNextTodoId: (dateString: string) => number;
  clearAllData: () => void;
  
  // 테스트 데이터 관리
  generateTestData: () => Promise<number>;
  getAllSchedulesByYear: () => { [year: string]: { [month: string]: { [dateString: string]: TodoItem[] } } };
  getScheduleSummary: () => { totalSchedules: number; completedSchedules: number; pendingSchedules: number };
}

// 디바운스 함수
const debounce = <T extends unknown[]>(
  func: (...args: T) => void, 
  wait: number
) => {
  let timeout: number;
  return function executedFunction(...args: T) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const useTodoStore = create<TodoStore>()(
  subscribeWithSelector((set, get) => {
    // 디바운스된 동기화 함수
    const debouncedSync = debounce((dateString: string) => {
      get().syncToServer(dateString);
    }, 2000); // 2초 후 동기화

    return {
      // 초기 상태
      schedules: {},
      isLoading: false,
      isSyncing: false,
      lastSyncTime: null,
      pendingSyncs: new Set(),

      // 스토어 초기화
      initializeStore: async () => {
        set({ isLoading: true });
        try {
          const response = await scheduleApi.getAllSchedules();
          if (response.success && response.data) {
            const schedules: { [key: string]: ScheduleData } = {};
            response.data.forEach((schedule) => {
              schedules[schedule.dateString] = {
                todos: schedule.todos,
                nextTodoId: schedule.nextTodoId,
                lastModified: new Date(schedule.updatedAt),
                isModified: false,
              };
            });
            set({ schedules, lastSyncTime: new Date() });
          }
        } catch (error) {
          console.error('Failed to initialize store:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // 서버에서 특정 날짜 데이터 로드
      loadScheduleFromServer: async (dateString: string) => {
        try {
          const response = await scheduleApi.getScheduleByDate(dateString);
          if (response.success && response.data) {
            set((state) => ({
              schedules: {
                ...state.schedules,
                [dateString]: {
                  todos: response.data!.todos,
                  nextTodoId: response.data!.nextTodoId,
                  lastModified: new Date(response.data!.updatedAt),
                  isModified: false,
                },
              },
            }));
          }
        } catch (error) {
          console.error('Failed to load schedule:', error);
        }
      },

      // 할일 완료 상태 토글 (즉시 UI 업데이트)
      toggleTodoCompletion: (dateString: string, todoId: number) => {
        set((state) => {
          const schedule = state.schedules[dateString];
          if (!schedule) return state;

          const updatedTodos = schedule.todos.map((todo) =>
            todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
          );

          const newPendingSyncs = new Set(state.pendingSyncs);
          newPendingSyncs.add(dateString);

          // 디바운스된 동기화 트리거
          debouncedSync(dateString);

          return {
            schedules: {
              ...state.schedules,
              [dateString]: {
                ...schedule,
                todos: updatedTodos,
                lastModified: new Date(),
                isModified: true,
              },
            },
            pendingSyncs: newPendingSyncs,
          };
        });

        // 즉시 이벤트 발생 (UI 업데이트용)
        window.dispatchEvent(new CustomEvent('todo-updated', {
          detail: { dateString, type: 'toggle', todoId }
        }));
      },

      // 할일 텍스트 업데이트
      updateTodoText: (dateString: string, todoId: number, text: string) => {
        set((state) => {
          const schedule = state.schedules[dateString];
          if (!schedule) return state;

          const updatedTodos = schedule.todos.map((todo) =>
            todo.id === todoId ? { ...todo, text } : todo
          );

          const newPendingSyncs = new Set(state.pendingSyncs);
          newPendingSyncs.add(dateString);

          // 디바운스된 동기화 트리거
          debouncedSync(dateString);

          return {
            schedules: {
              ...state.schedules,
              [dateString]: {
                ...schedule,
                todos: updatedTodos,
                lastModified: new Date(),
                isModified: true,
              },
            },
            pendingSyncs: newPendingSyncs,
          };
        });

        // 즉시 이벤트 발생
        window.dispatchEvent(new CustomEvent('todo-updated', {
          detail: { dateString, type: 'update', todoId }
        }));
      },

      // 새 할일 추가
      addTodo: (dateString: string, todo: Omit<TodoItem, 'id'>) => {
        set((state) => {
          const schedule = state.schedules[dateString] || {
            todos: [],
            nextTodoId: 0,
            lastModified: new Date(),
            isModified: false,
          };

          const newTodo = {
            ...todo,
            id: schedule.nextTodoId,
          };

          const newPendingSyncs = new Set(state.pendingSyncs);
          newPendingSyncs.add(dateString);

          // 즉시 동기화 (새 할일은 중요)
          setTimeout(() => get().syncToServer(dateString), 100);

          return {
            schedules: {
              ...state.schedules,
              [dateString]: {
                ...schedule,
                todos: [...schedule.todos, newTodo],
                nextTodoId: schedule.nextTodoId + 1,
                lastModified: new Date(),
                isModified: true,
              },
            },
            pendingSyncs: newPendingSyncs,
          };
        });

        // 즉시 이벤트 발생
        window.dispatchEvent(new CustomEvent('todo-updated', {
          detail: { dateString, type: 'add' }
        }));
      },

      // 할일 삭제
      deleteTodo: (dateString: string, todoId: number) => {
        set((state) => {
          const schedule = state.schedules[dateString];
          if (!schedule) return state;

          const updatedTodos = schedule.todos.filter((todo) => todo.id !== todoId);

          const newPendingSyncs = new Set(state.pendingSyncs);
          newPendingSyncs.add(dateString);

          // 즉시 동기화 (삭제는 중요)
          setTimeout(() => get().syncToServer(dateString), 100);

          return {
            schedules: {
              ...state.schedules,
              [dateString]: {
                ...schedule,
                todos: updatedTodos,
                lastModified: new Date(),
                isModified: true,
              },
            },
            pendingSyncs: newPendingSyncs,
          };
        });

        // 즉시 이벤트 발생
        window.dispatchEvent(new CustomEvent('todo-updated', {
          detail: { dateString, type: 'delete', todoId }
        }));
      },

      // 할일 순서 변경
      reorderTodos: (dateString: string, todos: TodoItem[]) => {
        set((state) => {
          const schedule = state.schedules[dateString];
          if (!schedule) return state;

          const newPendingSyncs = new Set(state.pendingSyncs);
          newPendingSyncs.add(dateString);

          // 디바운스된 동기화
          debouncedSync(dateString);

          return {
            schedules: {
              ...state.schedules,
              [dateString]: {
                ...schedule,
                todos,
                lastModified: new Date(),
                isModified: true,
              },
            },
            pendingSyncs: newPendingSyncs,
          };
        });

        // 즉시 이벤트 발생
        window.dispatchEvent(new CustomEvent('todo-updated', {
          detail: { dateString, type: 'reorder' }
        }));
      },

      // 서버와 동기화
      syncToServer: async (dateString: string) => {
        const state = get();
        const schedule = state.schedules[dateString];
        
        if (!schedule || !schedule.isModified) return;

        set({ isSyncing: true });

        try {
          const response = await scheduleApi.saveSchedule(
            dateString,
            schedule.todos,
            schedule.nextTodoId
          );

          if (response.success) {
            // 동기화 성공
            set((currentState) => {
              const newPendingSyncs = new Set(currentState.pendingSyncs);
              newPendingSyncs.delete(dateString);

              return {
                schedules: {
                  ...currentState.schedules,
                  [dateString]: {
                    ...currentState.schedules[dateString],
                    isModified: false,
                    lastModified: new Date(),
                  },
                },
                pendingSyncs: newPendingSyncs,
                lastSyncTime: new Date(),
              };
            });

            console.log(`✅ Synced ${dateString} to server`);
          } else {
            throw new Error(response.error || 'Sync failed');
          }
        } catch (error) {
          console.error('❌ Failed to sync to server:', error);
          
          // 사용자에게 알림 (선택적)
          window.dispatchEvent(new CustomEvent('sync-error', {
            detail: { dateString, error }
          }));
        } finally {
          set({ isSyncing: false });
        }
      },

      // 모든 대기 중인 동기화 실행
      syncAllPending: async () => {
        const { pendingSyncs } = get();
        const promises = Array.from(pendingSyncs).map((dateString) =>
          get().syncToServer(dateString)
        );
        await Promise.all(promises);
      },

      // 할일 목록 가져오기
      getTodos: (dateString: string) => {
        const schedule = get().schedules[dateString];
        return schedule ? schedule.todos : [];
      },

      // 다음 할일 ID 가져오기
      getNextTodoId: (dateString: string) => {
        const schedule = get().schedules[dateString];
        return schedule ? schedule.nextTodoId : 0;
      },

      // 모든 데이터 초기화
      clearAllData: () => {
        set({
          schedules: {},
          pendingSyncs: new Set(),
          lastSyncTime: null,
        });

        // 서버에서도 삭제
        scheduleApi.clearAllSchedules().catch(console.error);

        // 이벤트 발생
        window.dispatchEvent(new CustomEvent('data-cleared'));
      },

      // 테스트 데이터 생성
      generateTestData: async (): Promise<number> => {
        try {
          const response = await scheduleApi.generateTestData();
          if (response.success && response.data) {
            // 서버에서 최신 데이터 다시 로드
            await get().initializeStore();
            
            // 변경사항 알림 이벤트 발생
            window.dispatchEvent(new CustomEvent('todo-updated', {
              detail: { dateString: 'multiple', type: 'test-data-generated' }
            }));
            
            return response.data.count;
          } else {
            throw new Error(response.error || 'Failed to generate test data');
          }
        } catch (error) {
          console.error('Error generating test data:', error);
          throw error;
        }
      },

      // 년도별 일정 데이터 구성
      getAllSchedulesByYear: () => {
        const state = get();
        const schedulesByYear: { [year: string]: { [month: string]: { [dateString: string]: TodoItem[] } } } = {};

        Object.entries(state.schedules).forEach(([dateString, scheduleData]) => {
          // dateString format: "12월 25일"
          const match = dateString.match(/(\d+)월\s*(\d+)일/);
          if (match) {
            const month = match[1].padStart(2, '0');
            const currentYear = new Date().getFullYear().toString();
            
            if (!schedulesByYear[currentYear]) {
              schedulesByYear[currentYear] = {};
            }
            if (!schedulesByYear[currentYear][month]) {
              schedulesByYear[currentYear][month] = {};
            }
            
            schedulesByYear[currentYear][month][dateString] = scheduleData.todos;
          }
        });

        return schedulesByYear;
      },

      // 일정 요약 정보
      getScheduleSummary: () => {
        const state = get();
        let totalSchedules = 0;
        let completedSchedules = 0;

        Object.values(state.schedules).forEach((scheduleData) => {
          scheduleData.todos.forEach((todo) => {
            totalSchedules++;
            if (todo.completed) {
              completedSchedules++;
            }
          });
        });

        return {
          totalSchedules,
          completedSchedules,
          pendingSchedules: totalSchedules - completedSchedules,
        };
      },
    };
  })
);

// 페이지 벗어날 때 자동 동기화
window.addEventListener('beforeunload', () => {
  const store = useTodoStore.getState();
  if (store.pendingSyncs.size > 0) {
    // 동기 요청으로 마지막 시도 (제한적)
    navigator.sendBeacon('/api/sync', JSON.stringify({
      pendingSyncs: Array.from(store.pendingSyncs)
    }));
  }
});

// 주기적 자동 동기화 (5분마다)
setInterval(() => {
  const store = useTodoStore.getState();
  if (store.pendingSyncs.size > 0) {
    store.syncAllPending();
  }
}, 5 * 60 * 1000); 