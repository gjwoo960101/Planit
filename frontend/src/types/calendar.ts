export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  estimatedTime: number; // 분 단위
  startTime?: string;
  endTime?: string;
  repeat: "none" | "daily" | "weekly" | "monthly";
  category: string;
  color: string;
  priority: "high" | "medium" | "low";
  order: number;
}

export interface NewTodoForm {
  text: string;
  estimatedTime: number;
  startTime: string;
  endTime: string;
  repeat: "none" | "daily" | "weekly" | "monthly";
  category: string;
  priority: "high" | "medium" | "low";
}

export interface Category {
  name: string;
  color: string;
}

export interface Priority {
  level: "high" | "medium" | "low";
  label: string;
  color: string;
} 