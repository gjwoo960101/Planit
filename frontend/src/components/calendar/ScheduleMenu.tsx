import React, { useState, useEffect, useMemo } from "react";
import { useModalStore } from "../modal/ModalStore";
import {
  getSchedulesByYear,
  getScheduleSummary,
  getKoreanDayName,
  ScheduleByYear,
} from "../../utils/calendarUtils";
import "../../styles/ScheduleMenu.css";

interface ScheduleMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleMenu = ({ isOpen, onClose }: ScheduleMenuProps) => {
  const [schedulesByYear, setSchedulesByYear] = useState<ScheduleByYear>({});
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const openModal = useModalStore((state) => state.openModal);

  // 일정 데이터 로드
  useEffect(() => {
    if (isOpen) {
      const schedules = getSchedulesByYear();
      setSchedulesByYear(schedules);

      // 현재 년도와 월은 기본으로 확장
      const currentYear = new Date().getFullYear().toString();
      const currentMonth = (new Date().getMonth() + 1)
        .toString()
        .padStart(2, "0");
      setExpandedYears(new Set([currentYear]));
      setExpandedMonths(new Set([`${currentYear}-${currentMonth}`]));
    }
  }, [isOpen]);

  // 일정 요약 정보
  const scheduleSummary = useMemo(() => {
    return getScheduleSummary();
  }, [schedulesByYear]);

  // 검색된 일정들
  const filteredSchedules = useMemo(() => {
    if (!searchTerm.trim()) return schedulesByYear;

    const filtered: ScheduleByYear = {};

    Object.entries(schedulesByYear).forEach(([year, months]) => {
      Object.entries(months).forEach(([month, days]) => {
        Object.entries(days).forEach(([dateString, todos]) => {
          const matchingTodos = todos.filter(
            (todo) =>
              todo.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
              todo.category.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (matchingTodos.length > 0) {
            if (!filtered[year]) filtered[year] = {};
            if (!filtered[year][month]) filtered[year][month] = {};
            filtered[year][month][dateString] = matchingTodos;
          }
        });
      });
    });

    return filtered;
  }, [schedulesByYear, searchTerm]);

  const toggleYear = (year: string) => {
    const newExpandedYears = new Set(expandedYears);
    if (newExpandedYears.has(year)) {
      newExpandedYears.delete(year);
      // 해당 년도의 모든 월도 닫기
      const newExpandedMonths = new Set(expandedMonths);
      Array.from(expandedMonths).forEach((monthKey) => {
        if (monthKey.startsWith(year)) {
          newExpandedMonths.delete(monthKey);
        }
      });
      setExpandedMonths(newExpandedMonths);
    } else {
      newExpandedYears.add(year);
    }
    setExpandedYears(newExpandedYears);
  };

  const toggleMonth = (year: string, month: string) => {
    const monthKey = `${year}-${month}`;
    const newExpandedMonths = new Set(expandedMonths);
    if (newExpandedMonths.has(monthKey)) {
      newExpandedMonths.delete(monthKey);
    } else {
      newExpandedMonths.add(monthKey);
    }
    setExpandedMonths(newExpandedMonths);
  };

  const handleScheduleClick = (dateString: string) => {
    openModal(dateString);
    onClose();
  };

  // 메뉴에서 할일 체크 토글 함수
  const handleToggleTodo = (
    dateString: string,
    todoIndex: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // 상위 클릭 이벤트 방지

    // localStorage에서 해당 날짜의 할일 목록 가져오기
    const existingTodos = JSON.parse(
      localStorage.getItem(`todos_${dateString}`) || "[]"
    );

    // 해당 인덱스의 할일 완료 상태 토글
    if (existingTodos[todoIndex]) {
      existingTodos[todoIndex].completed = !existingTodos[todoIndex].completed;

      // localStorage에 저장
      localStorage.setItem(
        `todos_${dateString}`,
        JSON.stringify(existingTodos)
      );

      // localStorage 변경 이벤트 발생
      window.dispatchEvent(
        new CustomEvent("local-storage-changed", {
          detail: {
            key: `todos_${dateString}`,
            date: dateString,
            todos: existingTodos,
          },
        })
      );

      // 데이터 다시 로드
      const schedules = getSchedulesByYear();
      setSchedulesByYear(schedules);
    }
  };

  // 테스트 데이터 생성 함수
  const generateTestData = () => {
    const categories = [
      { name: "업무", color: "#007bff" },
      { name: "개인", color: "#28a745" },
      { name: "운동", color: "#fd7e14" },
      { name: "공부", color: "#6f42c1" },
      { name: "기타", color: "#6c757d" },
    ];

    const priorities = ["high", "medium", "low"];
    const repeats = ["none", "daily", "weekly", "monthly"];

    const todoTexts = [
      "프로젝트 기획서 작성",
      "팀 미팅 참석",
      "운동하기 - 헬스장",
      "영어 공부 1시간",
      "독서 - 자기계발서",
      "친구와 저녁 약속",
      "병원 검진 받기",
      "쇼핑 - 생필품 구매",
      "영화 관람",
      "요리 연습",
      "블로그 포스팅 작성",
      "온라인 강의 수강",
      "부모님께 안부 전화",
      "자동차 정기 점검",
      "도서관에서 공부",
      "요가 클래스 참석",
      "재정 관리 점검",
      "새로운 기술 학습",
      "정리정돈 - 방 청소",
      "명상 및 휴식",
      "동네 산책하기",
      "반려동물 돌보기",
      "온라인 쇼핑",
      "게임하기",
      "음악 감상",
    ];

    function getRandomDate() {
      // 현재 년도 기준으로 ±2년 범위에서 랜덤 년도 선택
      const currentYear = new Date().getFullYear();
      const yearOffset = Math.floor(Math.random() * 5) - 2; // -2 ~ +2년
      const randomYear = currentYear + yearOffset;

      // 1~12월 중 완전 랜덤 선택
      const randomMonth = Math.floor(Math.random() * 12) + 1;

      // 해당 년월의 마지막 날 계산
      const lastDay = new Date(randomYear, randomMonth, 0).getDate();
      const randomDay = Math.floor(Math.random() * lastDay) + 1;

      return `${randomMonth}월 ${randomDay}일`;
    }

    function getRandomTime() {
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 4) * 15;
      return `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    }

    let generatedCount = 0;

    for (let i = 0; i < 20; i++) {
      const randomDate = getRandomDate();
      const existingTodos = JSON.parse(
        localStorage.getItem(`todos_${randomDate}`) || "[]"
      );

      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const hasTime = Math.random() > 0.5;
      const startTime = hasTime ? getRandomTime() : "";

      const newTodo = {
        id: existingTodos.length,
        text: todoTexts[Math.floor(Math.random() * todoTexts.length)],
        completed: Math.random() > 0.7,
        estimatedTime: Math.floor(Math.random() * 120) + 15,
        startTime: startTime,
        endTime: hasTime
          ? (() => {
              const start = new Date(`2000-01-01 ${startTime}`);
              const end = new Date(
                start.getTime() +
                  (Math.floor(Math.random() * 4) + 1) * 30 * 60000
              );
              return `${end.getHours().toString().padStart(2, "0")}:${end
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
            })()
          : "",
        repeat: repeats[Math.floor(Math.random() * repeats.length)],
        category: category.name,
        color: category.color,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        order: existingTodos.length,
      };

      existingTodos.push(newTodo);
      localStorage.setItem(
        `todos_${randomDate}`,
        JSON.stringify(existingTodos)
      );
      localStorage.setItem(
        `nextTodoId_${randomDate}`,
        existingTodos.length.toString()
      );
      generatedCount++;
    }

    // localStorage 변경 이벤트 발생
    window.dispatchEvent(
      new CustomEvent("local-storage-changed", {
        detail: { key: "todos_test", date: "test", todos: [] },
      })
    );

    // 데이터 다시 로드
    const schedules = getSchedulesByYear();
    setSchedulesByYear(schedules);

    alert(`✅ ${generatedCount}개의 테스트 일정이 생성되었습니다!`);
  };

  // 테스트 데이터 전체 삭제 함수
  const clearAllTestData = () => {
    const confirmDelete = window.confirm(
      "⚠️ 모든 일정 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다."
    );

    if (!confirmDelete) return;

    let deletedCount = 0;
    const keysToDelete: string[] = [];

    // localStorage에서 todos_와 nextTodoId_로 시작하는 모든 키 찾기
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("todos_") || key.startsWith("nextTodoId_"))) {
        keysToDelete.push(key);
        if (key.startsWith("todos_")) {
          try {
            const todos = JSON.parse(localStorage.getItem(key) || "[]");
            deletedCount += todos.length;
          } catch (error) {
            console.warn(`Failed to parse todos for key ${key}:`, error);
          }
        }
      }
    }

    // 찾은 키들 모두 삭제
    keysToDelete.forEach((key) => {
      localStorage.removeItem(key);
    });

    // localStorage 변경 이벤트 발생
    window.dispatchEvent(
      new CustomEvent("local-storage-changed", {
        detail: { key: "todos_cleared", date: "all", todos: [] },
      })
    );

    // 데이터 다시 로드
    const schedules = getSchedulesByYear();
    setSchedulesByYear(schedules);

    alert(`🗑️ 총 ${deletedCount}개의 일정이 삭제되었습니다.`);
  };

  const getMonthName = (month: string) => {
    return `${parseInt(month)}월`;
  };

  const parseDateString = (dateString: string) => {
    const match = dateString.match(/(\d+)월\s*(\d+)일/);
    if (match) {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      return { month, day };
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-menu-overlay" onClick={onClose}>
      <div className="schedule-menu" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-menu-header">
          <h2>전체 일정 목록</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="schedule-summary">
          <div className="summary-item">
            <span className="summary-label">전체 일정</span>
            <span className="summary-value">
              {scheduleSummary.totalSchedules}개
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">완료</span>
            <span className="summary-value completed">
              {scheduleSummary.completedSchedules}개
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">미완료</span>
            <span className="summary-value pending">
              {scheduleSummary.pendingSchedules}개
            </span>
          </div>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="일정 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="schedule-content">
          {Object.keys(filteredSchedules).length === 0 ? (
            <div className="no-schedules">
              {searchTerm ? "검색 결과가 없습니다." : "등록된 일정이 없습니다."}
            </div>
          ) : (
            Object.entries(filteredSchedules)
              .sort(([a], [b]) => parseInt(b) - parseInt(a)) // 년도 내림차순
              .map(([year, months]) => (
                <div key={year} className="year-group">
                  <div className="year-header" onClick={() => toggleYear(year)}>
                    <span
                      className={`expand-icon ${
                        expandedYears.has(year) ? "expanded" : ""
                      }`}
                    >
                      ▶
                    </span>
                    <span className="year-title">{year}년</span>
                    <span className="year-count">
                      {Object.values(months).reduce(
                        (total, days) =>
                          total +
                          Object.values(days).reduce(
                            (dayTotal, todos) => dayTotal + todos.length,
                            0
                          ),
                        0
                      )}
                      개 일정
                    </span>
                  </div>

                  {expandedYears.has(year) && (
                    <div className="months-container">
                      {Object.entries(months)
                        .sort(([a], [b]) => parseInt(b) - parseInt(a)) // 월 내림차순
                        .map(([month, days]) => (
                          <div key={month} className="month-group">
                            <div
                              className="month-header"
                              onClick={() => toggleMonth(year, month)}
                            >
                              <span
                                className={`expand-icon ${
                                  expandedMonths.has(`${year}-${month}`)
                                    ? "expanded"
                                    : ""
                                }`}
                              >
                                ▶
                              </span>
                              <span className="month-title">
                                {getMonthName(month)}
                              </span>
                              <span className="month-count">
                                {Object.values(days).reduce(
                                  (total, todos) => total + todos.length,
                                  0
                                )}
                                개 일정
                              </span>
                            </div>

                            {expandedMonths.has(`${year}-${month}`) && (
                              <div className="days-container">
                                {Object.entries(days)
                                  .sort(([a], [b]) => {
                                    const dateA = parseDateString(a);
                                    const dateB = parseDateString(b);
                                    if (dateA && dateB) {
                                      return dateB.day - dateA.day; // 일 내림차순
                                    }
                                    return 0;
                                  })
                                  .map(([dateString, todos]) => {
                                    const parsedDate =
                                      parseDateString(dateString);
                                    const dayName = parsedDate
                                      ? getKoreanDayName(
                                          parseInt(year),
                                          parsedDate.month,
                                          parsedDate.day
                                        )
                                      : "";

                                    return (
                                      <div
                                        key={dateString}
                                        className="day-group"
                                      >
                                        <div className="day-header">
                                          <span className="day-title">
                                            {dateString} ({dayName})
                                          </span>
                                          <span className="day-count">
                                            {todos.length}개
                                          </span>
                                        </div>
                                        <div className="todos-list">
                                          {todos.map((todo, index) => (
                                            <div
                                              key={`${todo.id}-${index}`}
                                              className={`todo-item-menu ${
                                                todo.completed
                                                  ? "completed"
                                                  : ""
                                              }`}
                                              onClick={() =>
                                                handleScheduleClick(dateString)
                                              }
                                            >
                                              <div className="todo-content">
                                                <span className="todo-text">
                                                  {todo.text}
                                                </span>
                                                <div className="todo-meta">
                                                  <span
                                                    className="todo-category"
                                                    style={{
                                                      backgroundColor:
                                                        todo.color,
                                                    }}
                                                  >
                                                    {todo.category}
                                                  </span>
                                                  {todo.startTime && (
                                                    <span className="todo-time">
                                                      {todo.startTime}
                                                      {todo.endTime &&
                                                        ` - ${todo.endTime}`}
                                                    </span>
                                                  )}
                                                  <span
                                                    className={`todo-priority priority-${todo.priority}`}
                                                  >
                                                    {todo.priority === "high"
                                                      ? "높음"
                                                      : todo.priority ===
                                                        "medium"
                                                      ? "보통"
                                                      : "낮음"}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="todo-status">
                                                <span
                                                  onClick={(e) =>
                                                    handleToggleTodo(
                                                      dateString,
                                                      index,
                                                      e
                                                    )
                                                  }
                                                >
                                                  {todo.completed ? "✓" : "○"}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>

        {/* 테스트 데이터 관리 버튼들 */}
        <div className="test-data-section">
          <div className="test-data-buttons">
            <button
              className="test-data-button generate"
              onClick={generateTestData}
              title="20개의 무작위 테스트 일정을 생성합니다"
            >
              🧪 테스트 데이터 생성 (20개)
            </button>
            <button
              className="test-data-button delete"
              onClick={clearAllTestData}
              title="모든 일정 데이터를 삭제합니다"
            >
              🗑️ 전체 데이터 삭제
            </button>
          </div>
          <p className="test-data-note">⚠️ 개발용 테스트 기능입니다</p>
        </div>
      </div>
    </div>
  );
};
