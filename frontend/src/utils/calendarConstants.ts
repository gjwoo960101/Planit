import { Category, Priority } from "../types/calendar";

// 카테고리 옵션
export const CATEGORIES: Category[] = [
  { name: "업무", color: "#007bff" },
  { name: "개인", color: "#28a745" },
  { name: "운동", color: "#fd7e14" },
  { name: "공부", color: "#6f42c1" },
  { name: "기타", color: "#6c757d" },
];

// 우선순위 옵션
export const PRIORITIES: Priority[] = [
  { level: "high", label: "높음", color: "#dc3545" },
  { level: "medium", label: "보통", color: "#ffc107" },
  { level: "low", label: "낮음", color: "#28a745" },
]; 