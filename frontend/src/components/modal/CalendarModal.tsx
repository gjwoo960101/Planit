import { useModalStore } from "./ModalStore";
import { useEffect, useState, useMemo, useRef } from "react";
import { TodoItem, NewTodoForm } from "../../types/calendar";
import { CATEGORIES, PRIORITIES } from "../../utils/calendarConstants";
import {
  getTodosFromStorage,
  saveTodosToStorage,
  getNextTodoId,
  saveNextTodoId,
  processRepeatingTodos,
} from "../../utils/calendarUtils";
import { AchievementSection } from "../calendar/AchievementSection";
import { CategoryFilter } from "../calendar/CategoryFilter";
import { TodoList } from "../calendar/TodoList";
import "../../styles/CalendarModal.css";

export const CalendarModal = () => {
  const isOpen = useModalStore((state) => state.isOpen);
  const selectedDate = useModalStore((state) => state.selectedDate);
  const closeModal = useModalStore((state) => state.closeModal);

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoId, setNewTodoId] = useState(0);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [isManualSort, setIsManualSort] = useState(false);

  // 새 할일 추가 폼 상태
  const [newTodo, setNewTodo] = useState<NewTodoForm>({
    text: "",
    estimatedTime: 30,
    startTime: "",
    endTime: "",
    repeat: "none",
    category: "업무",
    priority: "medium",
  });

  // 드래그 앤 드롭 상태
  const draggedItem = useRef<TodoItem | null>(null);
  const draggedOverItem = useRef<TodoItem | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);

  // 텍스트 포맷팅 함수 추가
  const insertTextAtCursor = (prefix: string, suffix: string = "") => {
    if (!editingTodo) return;

    // 임시로 textarea를 만들어서 선택 범위 처리
    const currentText = editingTodo.text;
    const newText = currentText + prefix + suffix;

    setEditingTodo((prev) => (prev ? { ...prev, text: newText } : null));
  };

  // 전체 달성률 계산 (필터와 상관없이)
  const { totalAchievementPercentage } = useMemo(() => {
    if (todos.length === 0) {
      return { totalAchievementPercentage: 0 };
    }

    const completedTodos = todos.filter((todo) => todo.completed).length;
    const totalTodos = todos.length;
    const achievement = Math.round((completedTodos / totalTodos) * 100);

    return {
      totalAchievementPercentage: achievement,
    };
  }, [todos]);

  // 필터링된 달성률 계산 (현재 표시중인 카테고리)
  const { achievementPercentage, remainingPercentage, isFiltered } =
    useMemo(() => {
      const filteredTodos =
        selectedCategory === "전체"
          ? todos
          : todos.filter((todo) => todo.category === selectedCategory);

      if (filteredTodos.length === 0) {
        return {
          achievementPercentage: 0,
          remainingPercentage: 0,
          isFiltered: selectedCategory !== "전체",
        };
      }

      const completedTodos = filteredTodos.filter(
        (todo) => todo.completed
      ).length;
      const totalTodos = filteredTodos.length;
      const achievement = Math.round((completedTodos / totalTodos) * 100);
      const remaining = 100 - achievement;

      return {
        achievementPercentage: achievement,
        remainingPercentage: remaining,
        isFiltered: selectedCategory !== "전체",
      };
    }, [todos, selectedCategory]);

  // 필터링된 할일 목록
  const filteredTodos = useMemo(() => {
    const filtered =
      selectedCategory === "전체"
        ? todos
        : todos.filter((todo) => todo.category === selectedCategory);

    // 수동 정렬 모드가 아닐 때만 우선순위 정렬
    return filtered.sort((a, b) => {
      if (!isManualSort) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
      }
      return a.order - b.order;
    });
  }, [todos, selectedCategory, isManualSort]);

  // 선택된 날짜의 할일 목록 로드
  useEffect(() => {
    if (selectedDate) {
      const storedTodos = getTodosFromStorage(selectedDate);
      const storedNextId = getNextTodoId(selectedDate);

      // 반복 일정 처리
      const repeatingTodos = processRepeatingTodos(selectedDate);

      // 반복 일정이 있고 기존 할일이 없으면 추가
      if (repeatingTodos.length > 0 && storedTodos.length === 0) {
        // 반복 할일들에 적절한 ID 할당
        const todosWithIds = repeatingTodos.map((todo, index) => ({
          ...todo,
          id: storedNextId + index,
          order: index,
        }));

        setTodos(todosWithIds);
        setNewTodoId(storedNextId + repeatingTodos.length);
      } else if (repeatingTodos.length > 0 && storedTodos.length > 0) {
        // 기존 할일이 있으면 반복 할일 중 중복되지 않는 것만 추가
        const newRepeatingTodos = repeatingTodos.filter(
          (repeatTodo) =>
            !storedTodos.some(
              (existingTodo) =>
                existingTodo.text === repeatTodo.text &&
                existingTodo.category === repeatTodo.category &&
                existingTodo.repeat === repeatTodo.repeat
            )
        );

        if (newRepeatingTodos.length > 0) {
          const todosWithIds = newRepeatingTodos.map((todo, index) => ({
            ...todo,
            id: storedNextId + index,
            order: storedTodos.length + index,
          }));

          setTodos([...storedTodos, ...todosWithIds]);
          setNewTodoId(storedNextId + newRepeatingTodos.length);
        } else {
          setTodos(storedTodos);
          setNewTodoId(storedNextId);
        }
      } else {
        setTodos(storedTodos);
        setNewTodoId(storedNextId);
      }
    }
  }, [selectedDate]);

  // 할일 목록이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (selectedDate && todos.length >= 0) {
      saveTodosToStorage(selectedDate, todos);
    }
  }, [selectedDate, todos]);

  // newTodoId가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (selectedDate) {
      saveNextTodoId(selectedDate, newTodoId);
    }
  }, [selectedDate, newTodoId]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setAnimateIn(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeModal]);

  const handleAddTodo = () => {
    setShowAddForm(true);
  };

  const handleSaveNewTodo = () => {
    if (newTodo.text.trim() === "") return;

    const categoryColor =
      CATEGORIES.find((cat) => cat.name === newTodo.category)?.color ||
      "#6c757d";

    const todoItem: TodoItem = {
      id: newTodoId,
      text: newTodo.text,
      completed: false,
      estimatedTime: newTodo.estimatedTime,
      startTime: newTodo.startTime,
      endTime: newTodo.endTime,
      repeat: newTodo.repeat,
      category: newTodo.category,
      color: categoryColor,
      priority: newTodo.priority,
      order: todos.length,
    };

    setTodos((prev) => [...prev, todoItem]);
    setNewTodoId((prev) => prev + 1);

    // 폼 초기화
    setNewTodo({
      text: "",
      estimatedTime: 30,
      startTime: "",
      endTime: "",
      repeat: "none",
      category: "업무",
      priority: "medium",
    });
    setShowAddForm(false);
  };

  const handleCancelNewTodo = () => {
    setNewTodo({
      text: "",
      estimatedTime: 30,
      startTime: "",
      endTime: "",
      repeat: "none",
      category: "업무",
      priority: "medium",
    });
    setShowAddForm(false);
  };

  const handleToggleComplete = (id: number) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleTextChange = (id: number, newText: string) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, text: newText } : todo
      )
    );
  };

  const handleFocus = (id: number) => {
    setEditingTodoId(id);
  };

  const handleBlur = () => {
    setEditingTodoId(null);
  };

  const handleDeleteTodo = (id: number) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  };

  const handleDeleteAll = () => {
    setTodos([]);
  };

  // 할일 상세 편집 모달 핸들러
  const handleTodoDoubleClick = (todo: TodoItem) => {
    setEditingTodo({ ...todo });
    setShowEditModal(true);
  };

  const handleEditModalSave = () => {
    if (editingTodo) {
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === editingTodo.id ? editingTodo : todo
        )
      );
      setShowEditModal(false);
      setEditingTodo(null);
    }
  };

  const handleEditModalCancel = () => {
    setShowEditModal(false);
    setEditingTodo(null);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, todo: TodoItem) => {
    draggedItem.current = todo;
    setDraggedItemId(todo.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", todo.id.toString());
  };

  const handleDragOver = (e: React.DragEvent, todo: TodoItem) => {
    e.preventDefault();
    if (draggedItem.current && draggedItem.current.id !== todo.id) {
      draggedOverItem.current = todo;
      setDragOverItemId(todo.id);
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // 실제로 요소를 벗어났는지 확인
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverItemId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetTodo: TodoItem) => {
    e.preventDefault();

    if (draggedItem.current && draggedItem.current.id !== targetTodo.id) {
      const draggedTodo = draggedItem.current;

      // 수동 정렬 모드로 전환
      setIsManualSort(true);

      // 드래그된 아이템과 타겟 아이템의 원래 order 값
      const draggedOrder = draggedTodo.order;
      const targetOrder = targetTodo.order;

      // 전체 todos 배열에서 order 재정렬
      const updatedTodos = todos.map((todo) => {
        if (todo.id === draggedTodo.id) {
          // 드래그된 아이템은 타겟 위치로 이동
          return { ...todo, order: targetOrder };
        } else if (draggedOrder < targetOrder) {
          // 드래그가 아래로 이동한 경우: draggedOrder와 targetOrder 사이의 아이템들을 위로 이동
          if (todo.order > draggedOrder && todo.order <= targetOrder) {
            return { ...todo, order: todo.order - 1 };
          }
        } else {
          // 드래그가 위로 이동한 경우: targetOrder와 draggedOrder 사이의 아이템들을 아래로 이동
          if (todo.order >= targetOrder && todo.order < draggedOrder) {
            return { ...todo, order: todo.order + 1 };
          }
        }
        return todo;
      });

      setTodos(updatedTodos);
    }

    // 상태 초기화
    draggedItem.current = null;
    draggedOverItem.current = null;
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDragEnd = () => {
    // 상태 초기화
    draggedItem.current = null;
    draggedOverItem.current = null;
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${isOpen ? "open" : ""}`}
      onClick={closeModal}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 기본 모달 내용 - EditModal이 열려있으면 숨김 */}
        {!showEditModal && (
          <>
            <div className="modal-header-enhanced">
              <h2 className="modal-title-enhanced">
                <span className="modal-title-icon">📅</span>
                {selectedDate} 오늘의 일정
              </h2>
              <button className="close-button-enhanced" onClick={closeModal}>
                ✕
              </button>
            </div>
            <div className="modal-body-new">
              <AchievementSection
                achievementPercentage={achievementPercentage}
                remainingPercentage={remainingPercentage}
                isFiltered={isFiltered}
                selectedCategory={selectedCategory}
                totalAchievementPercentage={totalAchievementPercentage}
                animateIn={animateIn}
              />

              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />

              <TodoList
                filteredTodos={filteredTodos}
                showAddForm={showAddForm}
                newTodo={newTodo}
                editingTodoId={editingTodoId}
                draggedItemId={draggedItemId}
                dragOverItemId={dragOverItemId}
                onAddTodo={handleAddTodo}
                onDeleteAll={handleDeleteAll}
                onNewTodoChange={setNewTodo}
                onSaveNewTodo={handleSaveNewTodo}
                onCancelNewTodo={handleCancelNewTodo}
                onToggleComplete={handleToggleComplete}
                onTextChange={handleTextChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onDeleteTodo={handleDeleteTodo}
                onTodoDoubleClick={handleTodoDoubleClick}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            </div>
          </>
        )}

        {/* EditTodoModal을 같은 modal-content 내부에 렌더링 */}
        {showEditModal && editingTodo && (
          <>
            <div className="modal-header-enhanced">
              <h2 className="modal-title-enhanced">
                <span className="modal-title-icon">✏️</span>
                할일 상세 편집
              </h2>
              <button
                className="close-button-enhanced"
                onClick={handleEditModalCancel}
              >
                ✕
              </button>
            </div>
            <div className="modal-body-new" style={{ padding: "20px" }}>
              <div className="add-todo-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>할일 내용</label>
                    <div className="enhanced-text-editor">
                      {/* 텍스트 포맷팅 툴바 */}
                      <div className="text-toolbar">
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertTextAtCursor("**", "**")}
                          title="굵게"
                        >
                          <strong>B</strong>
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertTextAtCursor("*", "*")}
                          title="기울임"
                        >
                          <em>I</em>
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertTextAtCursor("• ")}
                          title="목록"
                        >
                          ••
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertTextAtCursor("✓ ")}
                          title="체크리스트"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertTextAtCursor("😊")}
                          title="이모지"
                        >
                          😊
                        </button>
                      </div>

                      <textarea
                        value={editingTodo.text}
                        onChange={(e) =>
                          setEditingTodo((prev) =>
                            prev ? { ...prev, text: e.target.value } : null
                          )
                        }
                        className="enhanced-textarea-fixed"
                        placeholder="할일을 입력하세요...&#10;• 목록 형태로 입력 가능&#10;✓ 체크리스트 형태로 입력 가능&#10;**굵게**, *기울임* 마크다운 지원&#10;😊 이모지 사용 가능"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>예상 소요시간</label>
                    <div className="time-duration-selects">
                      <select
                        value={Math.floor(editingTodo.estimatedTime / 60)}
                        onChange={(e) =>
                          setEditingTodo((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  estimatedTime:
                                    parseInt(e.target.value) * 60 +
                                    (prev.estimatedTime % 60),
                                }
                              : null
                          )
                        }
                        className="select-input modal-select time-duration-select"
                      >
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        ))}
                      </select>
                      <span className="time-unit">시간</span>

                      <select
                        value={editingTodo.estimatedTime % 60}
                        onChange={(e) =>
                          setEditingTodo((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  estimatedTime:
                                    Math.floor(prev.estimatedTime / 60) * 60 +
                                    parseInt(e.target.value),
                                }
                              : null
                          )
                        }
                        className="select-input modal-select time-duration-select"
                      >
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(
                          (minute) => (
                            <option key={minute} value={minute}>
                              {minute}
                            </option>
                          )
                        )}
                      </select>
                      <span className="time-unit">분</span>
                    </div>
                  </div>
                </div>

                <div className="time-input-section">
                  <div className="time-input-group-spaced">
                    <div className="form-group">
                      <label>시작시간</label>
                      <input
                        type="time"
                        value={editingTodo.startTime || ""}
                        onChange={(e) =>
                          setEditingTodo((prev) =>
                            prev ? { ...prev, startTime: e.target.value } : null
                          )
                        }
                        onClick={(e) => {
                          const input = e.target as HTMLInputElement;
                          if (
                            input.showPicker &&
                            typeof input.showPicker === "function"
                          ) {
                            try {
                              input.showPicker();
                            } catch {
                              console.log("showPicker not supported");
                            }
                          }
                        }}
                        className="time-input form-input-enhanced"
                      />
                    </div>

                    <div className="form-group">
                      <label>마감시간</label>
                      <input
                        type="time"
                        value={editingTodo.endTime || ""}
                        onChange={(e) =>
                          setEditingTodo((prev) =>
                            prev ? { ...prev, endTime: e.target.value } : null
                          )
                        }
                        onClick={(e) => {
                          const input = e.target as HTMLInputElement;
                          if (
                            input.showPicker &&
                            typeof input.showPicker === "function"
                          ) {
                            try {
                              input.showPicker();
                            } catch {
                              console.log("showPicker not supported");
                            }
                          }
                        }}
                        className="time-input form-input-enhanced"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>반복 설정</label>
                    <select
                      value={editingTodo.repeat}
                      onChange={(e) =>
                        setEditingTodo((prev) =>
                          prev
                            ? {
                                ...prev,
                                repeat: e.target.value as
                                  | "none"
                                  | "daily"
                                  | "weekly"
                                  | "monthly",
                              }
                            : null
                        )
                      }
                      className="select-input form-input-enhanced modal-select"
                    >
                      <option value="none">반복 안함</option>
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                      <option value="monthly">매월</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>카테고리</label>
                    <select
                      value={editingTodo.category}
                      onChange={(e) =>
                        setEditingTodo((prev) =>
                          prev
                            ? {
                                ...prev,
                                category: e.target.value,
                                color:
                                  CATEGORIES.find(
                                    (cat) => cat.name === e.target.value
                                  )?.color || "#6c757d",
                              }
                            : null
                        )
                      }
                      className="select-input form-input-enhanced modal-select"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>우선순위</label>
                    <select
                      value={editingTodo.priority}
                      onChange={(e) =>
                        setEditingTodo((prev) =>
                          prev
                            ? {
                                ...prev,
                                priority: e.target.value as
                                  | "high"
                                  | "medium"
                                  | "low",
                              }
                            : null
                        )
                      }
                      className="select-input form-input-enhanced modal-select"
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority.level} value={priority.level}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="save-button" onClick={handleEditModalSave}>
                    저장
                  </button>
                  <button
                    className="cancel-button"
                    onClick={handleEditModalCancel}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 독립적인 EditTodoModal 제거 - 이제 위에서 처리함 */}
    </div>
  );
};
