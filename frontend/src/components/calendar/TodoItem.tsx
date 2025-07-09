import { TodoItem as TodoItemType } from "../../types/calendar";
import { PRIORITIES } from "../../utils/calendarConstants";
import { formatTime } from "../../utils/calendarUtils";

interface TodoItemProps {
  todo: TodoItemType;
  editingTodoId: number | null;
  draggedItemId: number | null;
  dragOverItemId: number | null;
  onToggleComplete: (id: number) => void;
  onTextChange: (id: number, newText: string) => void;
  onFocus: (id: number) => void;
  onBlur: () => void;
  onDelete: (id: number) => void;
  onDoubleClick: (todo: TodoItemType) => void;
  onDragStart: (e: React.DragEvent, todo: TodoItemType) => void;
  onDragOver: (e: React.DragEvent, todo: TodoItemType) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, todo: TodoItemType) => void;
  onDragEnd: () => void;
}

export const TodoItem = ({
  todo,
  editingTodoId,
  draggedItemId,
  dragOverItemId,
  onToggleComplete,
  onTextChange,
  onFocus,
  onBlur,
  onDelete,
  onDoubleClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: TodoItemProps) => {
  return (
    <div
      className={`todo-item enhanced ${
        draggedItemId === todo.id ? "dragging" : ""
      } ${dragOverItemId === todo.id ? "drag-over" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, todo)}
      onDragOver={(e) => onDragOver(e, todo)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, todo)}
      onDragEnd={onDragEnd}
    >
      <div className="todo-item-main">
        <div className="todo-item-left">
          <div className="drag-handle">⋮⋮</div>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggleComplete(todo.id)}
          />
          <div
            className="priority-indicator"
            style={{
              backgroundColor: PRIORITIES.find((p) => p.level === todo.priority)
                ?.color,
            }}
            title={`우선순위: ${
              PRIORITIES.find((p) => p.level === todo.priority)?.label
            }`}
          ></div>
        </div>

        <div
          className="todo-item-content"
          onDoubleClick={() => onDoubleClick(todo)}
          title="더블클릭하여 상세 편집"
        >
          <input
            type="text"
            value={todo.text}
            onChange={(e) => onTextChange(todo.id, e.target.value)}
            onFocus={() => onFocus(todo.id)}
            onBlur={onBlur}
            readOnly={editingTodoId !== todo.id}
            className={`todo-text-input ${
              editingTodoId === todo.id ? "editing" : "read-only"
            } ${todo.completed ? "completed" : ""}`}
          />

          <div className="todo-item-details">
            <span
              className="category-tag"
              style={{ backgroundColor: todo.color }}
            >
              {todo.category}
            </span>

            {todo.estimatedTime > 0 && (
              <span className="time-estimate">
                ⏱ {formatTime(todo.estimatedTime)}
              </span>
            )}

            {todo.startTime && (
              <span className="time-range">
                🕐 {todo.startTime}
                {todo.endTime && ` - ${todo.endTime}`}
              </span>
            )}

            {todo.repeat !== "none" && (
              <span className="repeat-indicator">
                🔄{" "}
                {todo.repeat === "daily"
                  ? "매일"
                  : todo.repeat === "weekly"
                  ? "매주"
                  : "매월"}
              </span>
            )}
          </div>
        </div>

        <button
          className="delete-todo-button"
          onClick={() => onDelete(todo.id)}
          title="삭제"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
