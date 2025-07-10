# Backend API Integration Guide

## 개요

Planit 캘린더 앱이 백엔드 API 서버와 연동하도록 수정되었습니다. 이제 모든 일정 데이터는 백엔드 서버에서 관리됩니다.

## 환경 설정

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_API_URL=http://localhost:3001/api
```

### 2. 백엔드 서버 요구사항

백엔드 서버는 다음 API 엔드포인트를 제공해야 합니다:

## API 엔드포인트

### 📅 일정 관리

#### 1. 모든 일정 조회

```
GET /api/schedules
Response: {
  success: boolean,
  data: ScheduleData[]
}
```

#### 2. 특정 날짜 일정 조회

```
GET /api/schedules/:dateString
Response: {
  success: boolean,
  data: ScheduleData
}
```

#### 3. 일정 저장/업데이트

```
POST /api/schedules
Body: {
  dateString: string,
  todos: TodoItem[],
  nextTodoId: number
}
Response: {
  success: boolean,
  data: ScheduleData
}
```

#### 4. 일정 삭제

```
DELETE /api/schedules/:dateString
Response: {
  success: boolean
}
```

### 🎯 할 일 관리

#### 5. 할 일 업데이트

```
PUT /api/schedules/:dateString/todos/:todoId
Body: Partial<TodoItem>
Response: {
  success: boolean,
  data: ScheduleData
}
```

#### 6. 할 일 삭제

```
DELETE /api/schedules/:dateString/todos/:todoId
Response: {
  success: boolean,
  data: ScheduleData
}
```

#### 7. 할 일 완료 상태 토글

```
PATCH /api/schedules/:dateString/todos/:todoId/toggle
Response: {
  success: boolean,
  data: ScheduleData
}
```

### 🔧 유틸리티

#### 8. 모든 일정 삭제

```
DELETE /api/schedules
Response: {
  success: boolean
}
```

#### 9. 테스트 데이터 생성

```
POST /api/schedules/test-data
Response: {
  success: boolean,
  data: { count: number }
}
```

#### 10. 데이터 내보내기

```
GET /api/schedules/export
Response: {
  success: boolean,
  data: ScheduleData[]
}
```

#### 11. 데이터 가져오기

```
POST /api/schedules/import
Body: {
  schedules: ScheduleData[]
}
Response: {
  success: boolean,
  data: { imported: number }
}
```

## 데이터 타입

### ScheduleData

```typescript
interface ScheduleData {
  id: string;
  dateString: string;
  todos: TodoItem[];
  nextTodoId: number;
  createdAt: string;
  updatedAt: string;
}
```

### TodoItem

```typescript
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  estimatedTime: number;
  startTime: string;
  endTime: string;
  repeat: "none" | "daily" | "weekly" | "monthly";
  category: string;
  color: string;
  priority: "high" | "medium" | "low";
  order: number;
}
```

## 주요 변경사항

### 1. 데이터 저장 방식

- **이전**: localStorage 기반 클라이언트 저장
- **현재**: 백엔드 API 기반 서버 저장

### 2. HTTP 클라이언트 (axios)

- **axios 사용**: fetch API에서 axios로 변경
- **인터셉터**: 요청/응답 인터셉터를 통한 로깅 및 에러 처리
- **타임아웃**: 10초 타임아웃 설정
- **자동 JSON 파싱**: axios의 자동 JSON 변환 기능 활용
- **인스턴스 설정**: baseURL, timeout, headers 자동 설정

### 3. 함수 변경

모든 데이터 저장/조회 함수가 `async/await` 패턴으로 변경되었습니다:

- `getTodosFromData()` → `async getTodosFromData()`
- `saveTodosToData()` → `async saveTodosToData()`
- `clearAllData()` → `async clearAllData()`
- `generateTestDataToStorage()` → `async generateTestDataToStorage()`

### 4. 캐싱 시스템

- 성능 향상을 위해 메모리 캐시 사용
- 서버 응답 데이터를 로컬에 캐시하여 빠른 액세스 제공

### 5. 향상된 에러 처리

**HTTP 상태 코드별 한국어 에러 메시지**:

- 400: 잘못된 요청입니다.
- 401: 인증이 필요합니다.
- 403: 접근 권한이 없습니다.
- 404: 요청한 리소스를 찾을 수 없습니다.
- 500: 서버 내부 오류가 발생했습니다.
- 503: 서비스를 사용할 수 없습니다.

**네트워크 오류 처리**:

- 타임아웃: "요청 시간이 초과되었습니다."
- 네트워크 연결 오류: "네트워크 연결을 확인해주세요."

**서버 에러 메시지 우선**: 서버에서 반환한 에러 메시지가 있으면 우선 표시

## 개발 서버 실행

### 의존성 설치

```bash
# axios 설치 (이미 설치되어 있음)
npm install axios --legacy-peer-deps
```

### 서버 실행

```bash
# 프론트엔드 개발 서버
npm run dev

# 백엔드 서버는 별도로 실행 필요 (포트 3001)
```

## 주의사항

1. **백엔드 서버**: 백엔드 서버가 실행되지 않으면 앱이 정상 작동하지 않습니다.
2. **CORS 설정**: 백엔드에서 프론트엔드 도메인에 대한 CORS 허용 설정이 필요합니다.
3. **환경 변수**: `VITE_API_URL` 환경 변수가 올바르게 설정되었는지 확인하세요.
4. **API 응답 형식**: 백엔드 API 응답이 정의된 `ApiResponse<T>` 형식을 맞춰주세요.
5. **타임아웃**: axios 요청 타임아웃이 10초로 설정되어 있습니다.
6. **의존성 충돌**: axios 설치 시 `--legacy-peer-deps` 플래그가 필요할 수 있습니다.

## 문제 해결

### 1. 연결 오류

- 백엔드 서버가 실행 중인지 확인
- VITE_API_URL이 올바르게 설정되었는지 확인
- 네트워크 연결 상태 확인

### 2. CORS 오류

- 백엔드에서 프론트엔드 도메인에 대한 CORS 허용 설정
- 개발 환경에서는 `localhost:5173` 허용 필요

### 3. 타임아웃 오류

- axios 타임아웃(10초) 초과 시 "요청 시간이 초과되었습니다" 메시지
- 백엔드 응답 시간 최적화 필요
- 필요시 타임아웃 시간 조정

### 4. 의존성 설치 오류

```bash
# peer dependency 충돌 시
npm install axios --legacy-peer-deps
```

### 5. API 응답 형식 오류

- 백엔드가 `ApiResponse<T>` 형식으로 응답하는지 확인

```typescript
{
  success: boolean,
  data?: T,
  message?: string,
  error?: string
}
```

### 6. 데이터 로드 실패

- API 응답 형식이 올바른지 확인
- 개발자 도구 Network 탭에서 요청/응답 확인
- axios 인터셉터 로그 확인
