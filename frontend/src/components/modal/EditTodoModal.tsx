import { TodoItem } from "../../types/calendar";
import { CATEGORIES, PRIORITIES } from "../../utils/calendarConstants";
import { useState, useRef, useEffect } from "react";

interface EditTodoModalProps {
  showEditModal: boolean;
  editingTodo: TodoItem | null;
  onEditingTodoChange: (
    updater: (prev: TodoItem | null) => TodoItem | null
  ) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditTodoModal = ({
  showEditModal,
  editingTodo,
  onEditingTodoChange,
  onSave,
  onCancel,
}: EditTodoModalProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // 시간 옵션 생성
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // 텍스트 에어리어 자동 크기 조절
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (editingTodo?.text) {
      setTimeout(adjustTextareaHeight, 0);
    }
  }, [editingTodo?.text]);

  // 텍스트 포맷팅 함수
  const insertTextAtCursor = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText =
      textarea.value.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      textarea.value.substring(end);

    onEditingTodoChange((prev) => (prev ? { ...prev, text: newText } : null));

    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  if (!showEditModal || !editingTodo) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        style={{ width: "50vw", height: "auto", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-enhanced">
          <h2 className="modal-title-enhanced">
            <span className="modal-title-icon">✏️</span>
            할일 상세 편집
          </h2>
          <button className="close-button-enhanced" onClick={onCancel}>
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
                    ref={textareaRef}
                    value={editingTodo.text}
                    onChange={(e) => {
                      onEditingTodoChange((prev) =>
                        prev
                          ? {
                              ...prev,
                              text: e.target.value,
                            }
                          : null
                      );
                      adjustTextareaHeight();
                    }}
                    onFocus={() => setIsTextareaFocused(true)}
                    onBlur={() => setIsTextareaFocused(false)}
                    className={`enhanced-textarea ${
                      isTextareaFocused ? "focused" : ""
                    }`}
                    placeholder="할일을 입력하세요...&#10;• 목록 형태로 입력 가능&#10;✓ 체크리스트 형태로 입력 가능&#10;**굵게**, *기울임* 마크다운 지원&#10;😊 이모지 사용 가능"
                    rows={4}
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
                      onEditingTodoChange((prev) =>
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
                    {hourOptions.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <span className="time-unit">시간</span>

                  <select
                    value={editingTodo.estimatedTime % 60}
                    onChange={(e) =>
                      onEditingTodoChange((prev) =>
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
                    {minuteOptions.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
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
                      onEditingTodoChange((prev) =>
                        prev
                          ? {
                              ...prev,
                              startTime: e.target.value,
                            }
                          : null
                      )
                    }
                    onClick={(e) => {
                      // 브라우저 호환성을 위한 클릭 이벤트
                      const input = e.target as HTMLInputElement;
                      if (
                        input.showPicker &&
                        typeof input.showPicker === "function"
                      ) {
                        try {
                          input.showPicker();
                        } catch {
                          // showPicker가 지원되지 않는 경우 기본 동작
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
                      onEditingTodoChange((prev) =>
                        prev
                          ? {
                              ...prev,
                              endTime: e.target.value,
                            }
                          : null
                      )
                    }
                    onClick={(e) => {
                      // 브라우저 호환성을 위한 클릭 이벤트
                      const input = e.target as HTMLInputElement;
                      if (
                        input.showPicker &&
                        typeof input.showPicker === "function"
                      ) {
                        try {
                          input.showPicker();
                        } catch {
                          // showPicker가 지원되지 않는 경우 기본 동작
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
                    onEditingTodoChange((prev) =>
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
                    onEditingTodoChange((prev) =>
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
                    onEditingTodoChange((prev) =>
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
              <button className="save-button" onClick={onSave}>
                저장
              </button>
              <button className="cancel-button" onClick={onCancel}>
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
