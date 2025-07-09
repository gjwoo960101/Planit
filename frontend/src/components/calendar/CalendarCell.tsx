import { useModalStore } from "../modal/ModalStore";
import { CalendarCellType } from "../../types/calendarType";
import {
  getTodosFromStorage,
  processRepeatingTodos,
} from "../../utils/calendarUtils";
import { useMemo, useEffect, useState } from "react";

interface CalendarCellProps {
  data: CalendarCellType;
  currentMonth: number;
}

export const CalendarCell = ({ data, currentMonth }: CalendarCellProps) => {
  const openModal = useModalStore((state) => state.openModal);
  const [refreshKey, setRefreshKey] = useState(0);

  const stateClass = data.isPrevMonth
    ? "prev-month"
    : data.isNextMonth
    ? "next-month"
    : "current-month";

  // Calculate the actual month and year based on cell type
  const actualMonth = data.isPrevMonth
    ? currentMonth === 1
      ? 12
      : currentMonth - 1
    : data.isNextMonth
    ? currentMonth === 12
      ? 1
      : currentMonth + 1
    : currentMonth;

  const dateString = `${actualMonth}월 ${data.date}일`;

  // localStorage 변경 감지를 위한 effect
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.includes(dateString)) {
        setRefreshKey((prev) => prev + 1);
      }
    };

    // storage 이벤트 리스너 추가
    window.addEventListener("storage", handleStorageChange);

    // 같은 탭에서의 변경사항을 감지하기 위한 커스텀 이벤트
    const handleCustomStorageChange = (event: CustomEvent) => {
      if (event.detail.key && event.detail.key.includes(dateString)) {
        setRefreshKey((prev) => prev + 1);
      }
    };

    window.addEventListener(
      "local-storage-changed",
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "local-storage-changed",
        handleCustomStorageChange as EventListener
      );
    };
  }, [dateString]);

  // 각 날짜의 일정 개수를 계산
  const todoCount = useMemo(() => {
    const storedTodos = getTodosFromStorage(dateString);
    const repeatingTodos = processRepeatingTodos(dateString);

    // 반복 일정 중 기존에 없는 것만 카운트
    const newRepeatingTodos = repeatingTodos.filter(
      (repeatTodo) =>
        !storedTodos.some(
          (existingTodo) =>
            existingTodo.text === repeatTodo.text &&
            existingTodo.category === repeatTodo.category &&
            existingTodo.repeat === repeatTodo.repeat
        )
    );

    return storedTodos.length + newRepeatingTodos.length;
  }, [dateString, refreshKey]);

  // 일정이 있는지 여부에 따른 클래스
  const hasEventsClass = todoCount > 0 ? "has-events" : "";

  return (
    <div
      className={`day-div ${stateClass} ${hasEventsClass}`}
      onClick={() => openModal(`${actualMonth}월 ${data.date}일`)}
    >
      <div className="day-content">
        <span className="day-number">{data.date}</span>
        {todoCount > 0 && (
          <div className="event-indicator">
            <span className="event-count">{todoCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};
