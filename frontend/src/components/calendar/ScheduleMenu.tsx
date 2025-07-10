import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModalStore } from "../modal/ModalStore";
import { getKoreanDayName, ScheduleByYear } from "../../utils/calendarUtils";
import { useTodoStore } from "../../stores/todoStore";
import {
  downloadDataAsFile,
  loadDataFromFile,
  getDataStatus,
  clearAllData as clearAllDataOld,
  getSchedulesByYearFromData,
  getScheduleSummaryFromData,
  generateTestDataToStorage,
  toggleTodoCompletion as toggleTodoCompletionOld,
} from "../../utils/dataStorage";
import "../../styles/ScheduleMenu.css";

interface ScheduleMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleMenu = ({ isOpen, onClose }: ScheduleMenuProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [schedulesByYear, setSchedulesByYear] = useState<ScheduleByYear>({});
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [dataStatus, setDataStatus] = useState(getDataStatus());
  const openModal = useModalStore((state) => state.openModal);

  // Zustand 스토어 사용
  const {
    schedules,
    toggleTodoCompletion,
    clearAllData,
    generateTestData: generateTestDataFromStore,
    getAllSchedulesByYear,
    getScheduleSummary,
  } = useTodoStore();

  // 일정 데이터 로드
  useEffect(() => {
    const loadSchedules = async () => {
      if (isOpen) {
        try {
          const schedules = await getSchedulesByYearFromData();
          setSchedulesByYear(schedules);

          // 현재 년도와 월은 기본으로 확장
          const currentYear = new Date().getFullYear().toString();
          const currentMonth = (new Date().getMonth() + 1)
            .toString()
            .padStart(2, "0");
          setExpandedYears(new Set([currentYear]));
          setExpandedMonths(new Set([`${currentYear}-${currentMonth}`]));
        } catch (error) {
          console.error("Error loading schedules:", error);
          setSchedulesByYear({});
        }
      }
    };

    loadSchedules();
  }, [isOpen]);

  // 일정 요약 정보
  const [scheduleSummary, setScheduleSummary] = useState({
    totalSchedules: 0,
    completedSchedules: 0,
    pendingSchedules: 0,
  });

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summary = await getScheduleSummaryFromData();
        setScheduleSummary(summary);
      } catch (error) {
        console.error("Error loading schedule summary:", error);
        setScheduleSummary({
          totalSchedules: 0,
          completedSchedules: 0,
          pendingSchedules: 0,
        });
      }
    };

    loadSummary();
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

  const handleLoginClick = () => {
    navigate("/login");
    onClose();
  };

  // JSON 파일 다운로드
  const handleDownloadData = async () => {
    try {
      await downloadDataAsFile();
    } catch (error) {
      alert("다운로드에 실패했습니다: " + (error as Error).message);
    }
  };

  // JSON 파일 업로드
  const handleUploadData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await loadDataFromFile(file);
      // 데이터 로드 후 스케줄 새로고침
      const schedules = await getSchedulesByYearFromData();
      setSchedulesByYear(schedules);
      setDataStatus(getDataStatus());
      alert("데이터가 성공적으로 로드되었습니다!");
    } catch (error) {
      alert("파일 로드에 실패했습니다: " + (error as Error).message);
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 모든 데이터 삭제
  const handleClearAllData = async () => {
    const confirmDelete = window.confirm(
      "⚠️ 모든 일정 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다."
    );

    if (!confirmDelete) return;

    try {
      await clearAllData();
      const schedules = await getSchedulesByYearFromData();
      setSchedulesByYear(schedules);
      setDataStatus(getDataStatus());
      alert("모든 데이터가 삭제되었습니다.");
    } catch (error) {
      alert("데이터 삭제에 실패했습니다: " + (error as Error).message);
    }
  };

  // 메뉴에서 할일 체크 토글 함수
  const handleToggleTodo = (
    dateString: string,
    todoIndex: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // 상위 클릭 이벤트 방지

    const success = toggleTodoCompletion(dateString, todoIndex);

    if (success) {
      // 데이터 다시 로드
      const schedules = getSchedulesByYearFromData();
      setSchedulesByYear(schedules);
      setDataStatus(getDataStatus());
    }
  };

  // 테스트 데이터 생성 함수
  const generateTestData = async () => {
    try {
      const generatedCount = await generateTestDataFromStore();

      // Zustand 스토어에서 최신 데이터 가져오기
      const newSchedulesByYear = getAllSchedulesByYear();
      setSchedulesByYear(newSchedulesByYear);
      setDataStatus(getDataStatus());

      alert(`✅ ${generatedCount}개의 테스트 일정이 생성되었습니다!`);
    } catch (error) {
      console.error("테스트 데이터 생성 실패:", error);
      alert("테스트 데이터 생성에 실패했습니다.");
    }
  };

  // 테스트 데이터 전체 삭제 함수
  const clearAllTestData = () => {
    const currentStatus = getDataStatus();
    const totalTodos = currentStatus.totalTodos;

    const confirmDelete = window.confirm(
      "⚠️ 모든 일정 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다."
    );

    if (!confirmDelete) return;

    clearAllData();
    const schedules = getSchedulesByYearFromData();
    setSchedulesByYear(schedules);
    setDataStatus(getDataStatus());

    alert(`🗑️ 총 ${totalTodos}개의 일정이 삭제되었습니다.`);
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
          <div className="header-buttons">
            <button className="login-button" onClick={handleLoginClick}>
              로그인
            </button>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
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

        <div className="data-management-section">
          <div className="data-status">
            <span className="data-label">저장된 데이터</span>
            <span className="data-value">
              {dataStatus.totalDates}일 / {dataStatus.totalTodos}개 일정
            </span>
          </div>
          <div className="data-buttons">
            <button
              className="data-button download"
              onClick={handleDownloadData}
            >
              📥 다운로드
            </button>
            <button className="data-button upload" onClick={handleUploadData}>
              📤 업로드
            </button>
            <button className="data-button clear" onClick={handleClearAllData}>
              🗑️ 전체삭제
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
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
