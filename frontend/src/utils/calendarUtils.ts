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