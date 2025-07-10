import { useModalStore } from "../modal/ModalStore";
import { CalendarCellType } from "../../types/calendarType";
import { processRepeatingTodos } from "../../utils/calendarUtils";
import { useTodoStore } from "../../stores/todoStore";
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
  const { getTodos } = useTodoStore();
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

  // 데이터 변경 감지를 위한 effect
  useEffect(() => {
    // 컴포넌트 마운트 시 초기 데이터 로드를 위한 refresh
    setRefreshKey((prev) => prev + 1);

    // JSON 데이터 변경사항을 감지하기 위한 커스텀 이벤트들
    const handleDataChange = (event: CustomEvent) => {
      // 특정 날짜 변경이거나 전체 데이터 변경인 경우
      if (
        event.detail.date === dateString ||
        event.detail.date === "multiple" ||
        event.detail.date === "all" ||
        event.detail.key === "test-data-generated"
      ) {
        setRefreshKey((prev) => prev + 1);
      }
    };

    const handleDataLoad = () => {
      // 데이터 로드 시 전체 새로고침
      setRefreshKey((prev) => prev + 1);
    };

    const handleDataMigrated = () => {
      // 마이그레이션 완료 시 전체 새로고침
      setRefreshKey((prev) => prev + 1);
    };

    const handleDataCleared = () => {
      // 데이터 삭제 시 전체 새로고침
      setRefreshKey((prev) => prev + 1);
    };

    // 이벤트 리스너 추가
    window.addEventListener("data-changed", handleDataChange as EventListener);
    window.addEventListener("data-loaded", handleDataLoad as EventListener);
    window.addEventListener(
      "data-migrated",
      handleDataMigrated as EventListener
    );
    window.addEventListener("data-cleared", handleDataCleared as EventListener);

    return () => {
      window.removeEventListener(
        "data-changed",
        handleDataChange as EventListener
      );
      window.removeEventListener(
        "data-loaded",
        handleDataLoad as EventListener
      );
      window.removeEventListener(
        "data-migrated",
        handleDataMigrated as EventListener
      );
      window.removeEventListener(
        "data-cleared",
        handleDataCleared as EventListener
      );
    };
  }, [dateString]);

  // 각 날짜의 일정 개수를 계산
  const [todoCount, setTodoCount] = useState(0);

  useEffect(() => {
    // Zustand 스토어에서 직접 할일 목록 가져오기
    const storedTodos = getTodos(dateString);
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

    setTodoCount(storedTodos.length + newRepeatingTodos.length);
  }, [dateString, refreshKey, getTodos]);

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
