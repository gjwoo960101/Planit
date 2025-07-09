import { TodoItem as TodoItemType, NewTodoForm } from "../../types/calendar";
import { TodoItem } from "./TodoItem";
import { AddTodoForm } from "./AddTodoForm";

interface TodoListProps {
  filteredTodos: TodoItemType[];
  showAddForm: boolean;
  newTodo: NewTodoForm;
  editingTodoId: number | null;
  draggedItemId: number | null;
  dragOverItemId: number | null;
  onAddTodo: () => void;
  onDeleteAll: () => void;
  onNewTodoChange: (updater: (prev: NewTodoForm) => NewTodoForm) => void;
  onSaveNewTodo: () => void;
  onCancelNewTodo: () => void;
  onToggleComplete: (id: number) => void;
  onTextChange: (id: number, newText: string) => void;
  onFocus: (id: number) => void;
  onBlur: () => void;
  onDeleteTodo: (id: number) => void;
  onTodoDoubleClick: (todo: TodoItemType) => void;
  onDragStart: (e: React.DragEvent, todo: TodoItemType) => void;
  onDragOver: (e: React.DragEvent, todo: TodoItemType) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, todo: TodoItemType) => void;
  onDragEnd: () => void;
}

export const TodoList = ({
  filteredTodos,
  showAddForm,
  newTodo,
  editingTodoId,
  draggedItemId,
  dragOverItemId,
  onAddTodo,
  onDeleteAll,
  onNewTodoChange,
  onSaveNewTodo,
  onCancelNewTodo,
  onToggleComplete,
  onTextChange,
  onFocus,
  onBlur,
  onDeleteTodo,
  onTodoDoubleClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: TodoListProps) => {
  return (
    <div className="todo-list-section">
      <div className="todo-list-header">
        <h3>오늘 할 일 목록</h3>
        <div className="header-buttons">
          <button className="add-todo-button" onClick={onAddTodo}>
            일정 추가
          </button>
          <button className="delete-all-button" onClick={onDeleteAll}>
            전체 삭제
          </button>
        </div>
      </div>

      <AddTodoForm
        showAddForm={showAddForm}
        newTodo={newTodo}
        onNewTodoChange={onNewTodoChange}
        onSave={onSaveNewTodo}
        onCancel={onCancelNewTodo}
      />

      {filteredTodos.length === 0 ? (
        <p>할 일이 없습니다.</p>
      ) : (
        filteredTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            editingTodoId={editingTodoId}
            draggedItemId={draggedItemId}
            dragOverItemId={dragOverItemId}
            onToggleComplete={onToggleComplete}
            onTextChange={onTextChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onDelete={onDeleteTodo}
            onDoubleClick={onTodoDoubleClick}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          />
        ))
      )}
    </div>
  );
};
