import { NewTodoForm } from "../../types/calendar";
import { CATEGORIES, PRIORITIES } from "../../utils/calendarConstants";
import { useState } from "react";
import { LexicalEditor } from "./LexicalEditor";

interface AddTodoFormProps {
  showAddForm: boolean;
  newTodo: NewTodoForm;
  onNewTodoChange: (updater: (prev: NewTodoForm) => NewTodoForm) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const AddTodoForm = ({
  showAddForm,
  newTodo,
  onNewTodoChange,
  onSave,
  onCancel,
}: AddTodoFormProps) => {
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // 시간 옵션 생성
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  if (!showAddForm) return null;

  return (
    <div className="add-todo-form">
      <div className="form-row">
        <div className="form-group">
          <label>할일 내용</label>
          <LexicalEditor
            onChange={(value) => {
              onNewTodoChange((prev) => ({ ...prev, text: value }));
            }}
            onFocus={() => setIsTextareaFocused(true)}
            onBlur={() => setIsTextareaFocused(false)}
            placeholder="할 일을 입력하세요...&#10;• 목록 형태로 입력 가능&#10;✓ 체크리스트 형태로 입력 가능&#10;**굵게**, *기울임* 지원&#10;😊 이모지 사용 가능"
            className={isTextareaFocused ? "focused" : ""}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>예상 소요시간</label>
          <div className="time-duration-selects">
            <select
              value={Math.floor(newTodo.estimatedTime / 60)}
              onChange={(e) =>
                onNewTodoChange((prev) => ({
                  ...prev,
                  estimatedTime:
                    parseInt(e.target.value) * 60 + (prev.estimatedTime % 60),
                }))
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
              value={newTodo.estimatedTime % 60}
              onChange={(e) =>
                onNewTodoChange((prev) => ({
                  ...prev,
                  estimatedTime:
                    Math.floor(prev.estimatedTime / 60) * 60 +
                    parseInt(e.target.value),
                }))
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
              value={newTodo.startTime}
              onChange={(e) =>
                onNewTodoChange((prev) => ({
                  ...prev,
                  startTime: e.target.value,
                }))
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
              className="time-input"
            />
          </div>

          <div className="form-group">
            <label>마감시간</label>
            <input
              type="time"
              value={newTodo.endTime}
              onChange={(e) =>
                onNewTodoChange((prev) => ({
                  ...prev,
                  endTime: e.target.value,
                }))
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
              className="time-input"
            />
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>반복 설정</label>
          <select
            value={newTodo.repeat}
            onChange={(e) =>
              onNewTodoChange((prev) => ({
                ...prev,
                repeat: e.target.value as
                  | "none"
                  | "daily"
                  | "weekly"
                  | "monthly",
              }))
            }
            className="select-input modal-select"
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
            value={newTodo.category}
            onChange={(e) =>
              onNewTodoChange((prev) => ({
                ...prev,
                category: e.target.value,
              }))
            }
            className="select-input modal-select"
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
            value={newTodo.priority}
            onChange={(e) =>
              onNewTodoChange((prev) => ({
                ...prev,
                priority: e.target.value as "high" | "medium" | "low",
              }))
            }
            className="select-input modal-select"
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
  );
};
