import { useModalStore } from "../modal/ModalStore";
import { CalendarCellType } from "../../types/calendarType";
import {
  getTodosFromStorage,
  processRepeatingTodos,
} from "../../utils/calendarUtils";
import { useMemo, useEffect, useState } from "react";
import { HolidayInfo } from "../../utils/holidays";

interface CalendarCellProps {
  data: CalendarCellType;
  currentMonth: number;
  currentYear: number;
  today: {
    year: number;
    month: number;
    date: number;
  };
  holidays: HolidayInfo[];
}

export const CalendarCell = ({
  data,
  currentMonth,
  currentYear,
  today,
  holidays,
}: CalendarCellProps) => {
  const openModal = useModalStore((state) => state.openModal);
  const [refreshKey, setRefreshKey] = useState(0);

  const stateClass = data.isPrevMonth
    ? "prev-month"
    : data.isNextMonth
    ? "next-month"
    : "current-month";

  // 오늘 날짜인지 확인
  const isToday =
    !data.isPrevMonth &&
    !data.isNextMonth &&
    currentYear === today.year &&
    currentMonth === today.month &&
    data.date === today.date;

  // 실제 연도/월 계산 (이전달/다음달 고려)
  const actualYear = data.isPrevMonth
    ? currentMonth === 1
      ? currentYear - 1
      : currentYear
    : data.isNextMonth
    ? currentMonth === 12
      ? currentYear + 1
      : currentYear
    : currentYear;

  const actualMonth = data.isPrevMonth
    ? currentMonth === 1
      ? 12
      : currentMonth - 1
    : data.isNextMonth
    ? currentMonth === 12
      ? 1
      : currentMonth + 1
    : currentMonth;

  // 공휴일인지 확인
  const isHoliday = useMemo(() => {
    const dateString = `${actualYear}-${actualMonth
      .toString()
      .padStart(2, "0")}-${data.date.toString().padStart(2, "0")}`;
    return holidays.some((holiday) => holiday.date === dateString);
  }, [actualYear, actualMonth, data.date, holidays]);

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
  const todayClass = isToday ? "today" : "";
  const holidayClass = isHoliday ? "holiday" : "";

  return (
    <div
      className={`day-div ${stateClass} ${hasEventsClass} ${todayClass} ${holidayClass}`}
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
