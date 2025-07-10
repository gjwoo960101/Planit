import { useModalStore } from "./ModalStore";
import { useEffect, useState, useMemo, useRef } from "react";
import { TodoItem, NewTodoForm } from "../../types/calendar";
import { CATEGORIES, PRIORITIES } from "../../utils/calendarConstants";
import { processRepeatingTodos } from "../../utils/calendarUtils";
import { useTodoStore } from "../../stores/todoStore";
import { AchievementSection } from "../calendar/AchievementSection";
import { CategoryFilter } from "../calendar/CategoryFilter";
import { TodoList } from "../calendar/TodoList";
import { LexicalEditor } from "../calendar/LexicalEditor";
import "../../styles/CalendarModal.css";

export const CalendarModal = () => {
  const isOpen = useModalStore((state) => state.isOpen);
  const selectedDate = useModalStore((state) => state.selectedDate);
  const closeModal = useModalStore((state) => state.closeModal);

  // Zustand 스토어 사용
  const {
    getTodos,
    getNextTodoId,
    toggleTodoCompletion,
    updateTodoText,
    addTodo,
    deleteTodo,
    reorderTodos,
    loadScheduleFromServer,
  } = useTodoStore();

  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [isManualSort, setIsManualSort] = useState(false);

  // 실시간 할일 목록 (스토어에서 직접 가져오기)
  const todos = selectedDate ? getTodos(selectedDate) : [];
  const newTodoId = selectedDate ? getNextTodoId(selectedDate) : 0;

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

  // 선택된 날짜의 할일 목록 로드 (필요시 서버에서)
  useEffect(() => {
    if (selectedDate) {
      // 스토어에 데이터가 없으면 서버에서 로드
      if (todos.length === 0) {
        loadScheduleFromServer(selectedDate);
      }

      // 반복 일정 처리 (한 번만)
      const repeatingTodos = processRepeatingTodos(selectedDate);
      if (repeatingTodos.length > 0 && todos.length === 0) {
        repeatingTodos.forEach((todo: TodoItem) => {
          const newTodo = {
            ...todo,
            order: newTodoId,
          };
          addTodo(selectedDate, newTodo);
        });
      }
    }
  }, [selectedDate, todos.length, newTodoId, loadScheduleFromServer, addTodo]);

  // 데이터 저장은 이제 Zustand 스토어에서 자동으로 처리됩니다

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setAnimateIn(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      // 모달이 닫힐 때 상태 리셋
      setShowAddForm(false);
      setShowEditModal(false);
      setEditingTodo(null);
      setEditingTodoId(null);
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
    if (newTodo.text.trim() === "" || !selectedDate) return;

    const categoryColor =
      CATEGORIES.find((cat) => cat.name === newTodo.category)?.color ||
      "#6c757d";

    const todoItem = {
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

    // Zustand 스토어를 통해 할일 추가
    addTodo(selectedDate, todoItem);

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
    if (!selectedDate) return;
    // 즉시 UI 업데이트 + 백그라운드 동기화
    toggleTodoCompletion(selectedDate, id);
  };

  const handleTextChange = (id: number, newText: string) => {
    if (!selectedDate) return;
    // 즉시 UI 업데이트 + 백그라운드 동기화
    updateTodoText(selectedDate, id, newText);
  };

  const handleFocus = (id: number) => {
    setEditingTodoId(id);
  };

  const handleBlur = () => {
    setEditingTodoId(null);
  };

  const handleDeleteTodo = (id: number) => {
    if (!selectedDate) return;
    // 즉시 UI 업데이트 + 백그라운드 동기화
    deleteTodo(selectedDate, id);
  };

  const handleDeleteAll = () => {
    if (!selectedDate) return;
    const currentTodos = getTodos(selectedDate);
    currentTodos.forEach((todo) => deleteTodo(selectedDate, todo.id));
  };

  // 할일 상세 편집 모달 핸들러
  const handleTodoDoubleClick = (todo: TodoItem) => {
    setEditingTodo({ ...todo });
    setShowEditModal(true);
  };

  const handleEditModalSave = () => {
    if (editingTodo && selectedDate) {
      // 각 속성별로 업데이트
      updateTodoText(selectedDate, editingTodo.id, editingTodo.text);

      // 다른 속성들도 업데이트하려면 새로운 스토어 액션이 필요합니다
      // 현재는 텍스트만 업데이트

      setShowEditModal(false);
      setEditingTodo(null);
    }
  };

  const handleEditModalCancel = () => {
    setShowEditModal(false);
    setEditingTodo(null);
  };

  const handleEditingTodoTextChange = (value: string) => {
    setEditingTodo((prev) => (prev ? { ...prev, text: value } : null));
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

      if (selectedDate) {
        reorderTodos(selectedDate, updatedTodos);
      }
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
                    <LexicalEditor
                      onChange={handleEditingTodoTextChange}
                      placeholder="할 일을 입력하세요...&#10;• 목록 형태로 입력 가능&#10;✓ 체크리스트 형태로 입력 가능&#10;**굵게**, *기울임* 지원&#10;😊 이모지 사용 가능"
                      className="focused"
                      value={editingTodo.text}
                    />
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
