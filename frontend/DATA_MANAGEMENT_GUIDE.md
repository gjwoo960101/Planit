# 📊 Planit 캘린더 데이터 관리 시스템 가이드

## 🏗️ 전체 아키텍처 개요

Planit 캘린더는 **낙관적 업데이트(Optimistic Updates) + 백그라운드 동기화** 방식으로 데이터를 관리하여 최적의 사용자 경험을 제공합니다.

```
사용자 액션 → 즉시 UI 업데이트 → 백그라운드 서버 동기화
     ↓              ↓                    ↓
  클릭/입력    메모리 상태 변경        네트워크 요청
     ↓              ↓                    ↓
  체감 지연 0ms   즉각적 반응         조용한 동기화
```

## 🎯 핵심 원칙

### ✨ **사용자 우선 경험**

- **즉시 반응**: 모든 사용자 액션에 즉각적인 UI 피드백
- **끊김 없는 흐름**: 네트워크 지연과 무관한 부드러운 사용 경험
- **오프라인 내성**: 네트워크 오류 시에도 기본 기능 유지

### 🔄 **지능적인 동기화**

- **디바운싱**: 연속적인 액션을 묶어서 처리
- **우선순위**: 중요한 변경사항은 즉시, 일반적인 변경은 지연 동기화
- **자동 복구**: 실패한 동기화 자동 재시도

## 🛠️ 기술 스택

| 레이어              | 기술          | 역할                         |
| ------------------- | ------------- | ---------------------------- |
| **상태 관리**       | Zustand       | 전역 메모리 캐시 + 액션 관리 |
| **HTTP 클라이언트** | Axios         | 백엔드 API 통신              |
| **백엔드 연동**     | REST API      | 데이터 영구 저장             |
| **이벤트 시스템**   | Custom Events | 컴포넌트 간 실시간 동기화    |

## 📋 데이터 플로우 상세

### 1️⃣ **할일 완료 상태 토글**

```typescript
// 사용자가 체크박스 클릭
toggleTodoCompletion(dateString, todoId)
     ↓
// 1단계: 즉시 메모리 상태 업데이트 (0ms)
state.schedules[dateString].todos[todoId].completed = !completed
     ↓
// 2단계: UI 즉시 반영
CustomEvent('todo-updated') → 모든 관련 컴포넌트 리렌더링
     ↓
// 3단계: 2초 후 디바운스된 백그라운드 동기화
debouncedSync(dateString) → API.PUT /schedules/{date}/todos/{id}/toggle
     ↓
// 4단계: 동기화 상태 업데이트
isModified: false, lastSyncTime: new Date()
```

**⏱️ 타이밍:**

- **UI 반응**: 즉시 (0ms)
- **서버 동기화**: 2초 후 (디바운스)
- **체감 지연**: 없음

### 2️⃣ **새 할일 추가**

```typescript
// 사용자가 할일 추가 버튼 클릭
addTodo(dateString, newTodo)
     ↓
// 1단계: 즉시 메모리에 추가
const newTodo = { ...todo, id: getNextTodoId() }
state.schedules[dateString].todos.push(newTodo)
     ↓
// 2단계: UI 즉시 업데이트
CustomEvent('todo-updated') → 새 할일이 바로 화면에 표시
     ↓
// 3단계: 100ms 후 즉시 동기화 (중요한 변경사항)
setTimeout(() => syncToServer(dateString), 100)
     ↓
// 4단계: 서버 저장
API.POST /schedules → 백엔드 DB에 영구 저장
```

**⏱️ 타이밍:**

- **UI 반응**: 즉시 (0ms)
- **서버 동기화**: 100ms 후 (우선순위 높음)
- **체감 지연**: 없음

### 3️⃣ **테스트 데이터 생성**

```typescript
// 사용자가 테스트 데이터 생성 버튼 클릭
generateTestData()
     ↓
// 1단계: 서버에 테스트 데이터 생성 요청
API.POST /schedules/test-data → 백엔드에서 20개 데이터 생성
     ↓
// 2단계: 전체 데이터 다시 로드
initializeStore() → 서버에서 모든 최신 데이터 가져오기
     ↓
// 3단계: 메모리 상태 전체 업데이트
state.schedules = newSchedulesFromServer
     ↓
// 4단계: 전체 UI 리프레시
CustomEvent('todo-updated', { type: 'test-data-generated' })
```

**⏱️ 타이밍:**

- **서버 요청**: 즉시
- **데이터 로드**: 네트워크 속도에 따라 (보통 100-500ms)
- **UI 업데이트**: 데이터 로드 완료 후 즉시

### 4️⃣ **텍스트 편집**

```typescript
// 사용자가 할일 텍스트 편집
updateTodoText(dateString, todoId, newText)
     ↓
// 1단계: 즉시 메모리 업데이트
state.schedules[dateString].todos[todoId].text = newText
     ↓
// 2단계: 즉시 UI 반영
CustomEvent('todo-updated') → 타이핑하는 즉시 화면에 반영
     ↓
// 3단계: 2초 후 디바운스된 동기화 (타이핑 완료 후)
debouncedSync(dateString) → API.PUT /schedules/{date}/todos/{id}
```

**⏱️ 타이밍:**

- **UI 반응**: 즉시 (0ms, 타이핑할 때마다)
- **서버 동기화**: 2초 후 (타이핑 완료 감지)
- **체감 지연**: 없음

## ⚡ 동기화 전략

### 📊 **우선순위별 동기화 타이밍**

| 액션 유형         | UI 업데이트 | 동기화 타이밍     | 이유                                |
| ----------------- | ----------- | ----------------- | ----------------------------------- |
| **할일 토글**     | 즉시        | 2초 후 (디바운스) | 연속 클릭 시 과도한 요청 방지       |
| **텍스트 편집**   | 즉시        | 2초 후 (디바운스) | 타이핑 중 계속 요청하지 않음        |
| **할일 추가**     | 즉시        | 100ms 후          | 새 데이터는 빠르게 저장             |
| **할일 삭제**     | 즉시        | 100ms 후          | 데이터 손실 방지                    |
| **순서 변경**     | 즉시        | 2초 후 (디바운스) | 드래그 중 여러 변경사항 묶어서 처리 |
| **테스트 데이터** | 로드 후     | 즉시              | 대량 데이터는 서버 우선             |

### 🔄 **디바운스 메커니즘**

```typescript
// 디바운스 함수: 연속된 호출을 하나로 묶음
const debouncedSync = debounce((dateString: string) => {
  syncToServer(dateString);
}, 2000); // 2초 대기

// 사용자가 빠르게 여러 번 토글해도
toggleTodo() → debouncedSync()  // 타이머 시작
toggleTodo() → debouncedSync()  // 이전 타이머 취소, 새 타이머 시작
toggleTodo() → debouncedSync()  // 이전 타이머 취소, 새 타이머 시작
// 2초 후 한 번만 서버 동기화 실행
```

## 🎛️ 상태 관리 (Zustand 스토어)

### 📱 **메모리 기반 캐시**

```typescript
interface TodoStore {
  // 핵심 데이터 (메모리 캐시)
  schedules: { [dateString: string]: ScheduleData };

  // 동기화 상태
  pendingSyncs: Set<string>; // 동기화 대기 중인 날짜들
  isModified: boolean; // 로컬 변경사항 존재 여부
  lastSyncTime: Date | null; // 마지막 동기화 시간

  // 즉시 액션들 (UI 업데이트)
  toggleTodoCompletion(); // 완료 상태 토글
  updateTodoText(); // 텍스트 수정
  addTodo(); // 할일 추가
  deleteTodo(); // 할일 삭제

  // 백그라운드 액션들
  syncToServer(); // 개별 날짜 동기화
  syncAllPending(); // 모든 대기 중인 동기화
}
```

### 🔧 **데이터 접근 패턴**

```typescript
// ✅ 올바른 방식: 실시간 데이터 접근
const todos = getTodos(selectedDate); // 항상 최신 상태

// ❌ 잘못된 방식: useState로 복사본 사용
const [todos, setTodos] = useState([]); // 동기화 문제 발생
```

## 🌐 네트워크 통신 (Axios)

### 📡 **API 구성**

```typescript
// Axios 인스턴스 설정
const apiInstance = axios.create({
  baseURL: "http://localhost:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 자동 에러 처리
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API 요청 실패:", error);
    // 사용자 친화적 에러 메시지
    throw new Error(getKoreanErrorMessage(error));
  }
);
```

### 🔄 **API 엔드포인트**

```typescript
// 주요 API 호출들
GET    /api/schedules                    // 모든 일정 조회
GET    /api/schedules/:dateString        // 특정 날짜 일정 조회
POST   /api/schedules                    // 일정 저장/업데이트
DELETE /api/schedules/:dateString        // 일정 삭제
PUT    /api/schedules/:date/todos/:id    // 할일 업데이트
PATCH  /api/schedules/:date/todos/:id/toggle  // 할일 토글
POST   /api/schedules/test-data          // 테스트 데이터 생성
```

## 🎪 이벤트 시스템

### 📢 **컴포넌트 간 실시간 동기화**

```typescript
// 데이터 변경 시 이벤트 발생
window.dispatchEvent(
  new CustomEvent("todo-updated", {
    detail: { dateString, type: "toggle", todoId },
  })
);

// 컴포넌트에서 이벤트 수신
useEffect(() => {
  const handleTodoUpdate = (event) => {
    // 해당 날짜의 컴포넌트만 리렌더링
    if (event.detail.dateString === currentDate) {
      forceUpdate();
    }
  };

  window.addEventListener("todo-updated", handleTodoUpdate);
  return () => window.removeEventListener("todo-updated", handleTodoUpdate);
}, [currentDate]);
```

### 🎯 **이벤트 타입들**

| 이벤트         | 발생 시점        | 처리                   |
| -------------- | ---------------- | ---------------------- |
| `todo-updated` | 할일 변경        | 관련 컴포넌트 리렌더링 |
| `sync-error`   | 동기화 실패      | 사용자 알림            |
| `data-cleared` | 전체 데이터 삭제 | 전체 UI 리셋           |

## 🔄 자동화 기능

### ⏰ **주기적 동기화**

```typescript
// 5분마다 자동 동기화
setInterval(() => {
  const store = useTodoStore.getState();
  if (store.pendingSyncs.size > 0) {
    store.syncAllPending();
  }
}, 5 * 60 * 1000);
```

### 🚪 **페이지 이탈 시 동기화**

```typescript
// 브라우저 종료/새로고침 시 마지막 동기화 시도
window.addEventListener("beforeunload", () => {
  const store = useTodoStore.getState();
  if (store.pendingSyncs.size > 0) {
    // sendBeacon으로 동기 요청 (제한적)
    navigator.sendBeacon(
      "/api/sync",
      JSON.stringify({
        pendingSyncs: Array.from(store.pendingSyncs),
      })
    );
  }
});
```

## 🛡️ 에러 처리 및 복구

### ⚠️ **에러 시나리오별 처리**

| 시나리오              | 사용자 경험              | 백그라운드 처리    |
| --------------------- | ------------------------ | ------------------ |
| **네트워크 오류**     | UI 정상 작동 유지        | 자동 재시도 대기열 |
| **서버 에러 (500)**   | 에러 토스트 표시         | 재시도 후 포기     |
| **인증 만료 (401)**   | 로그인 페이지 리다이렉트 | 세션 갱신 시도     |
| **유효성 오류 (400)** | 구체적 에러 메시지       | 로컬 데이터 롤백   |

### 🔄 **자동 복구 메커니즘**

```typescript
// 동기화 실패 시 재시도
const syncToServer = async (dateString: string) => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await api.saveSchedule(dateString, todos, nextTodoId);
      break; // 성공 시 루프 종료
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        // 최종 실패 시 사용자 알림
        notifyUser(`동기화 실패: ${error.message}`);
      } else {
        // 지수 백오프로 재시도
        await delay(Math.pow(2, attempt) * 1000);
      }
    }
  }
};
```

## 📊 성능 최적화

### ⚡ **메모리 효율성**

- **선택적 로딩**: 필요한 날짜의 데이터만 로드
- **메모리 캐시**: 한 번 로드된 데이터는 메모리에 유지
- **가비지 컬렉션**: 오래된 데이터 자동 정리 (향후 구현 예정)

### 🚀 **네트워크 최적화**

- **배치 요청**: 여러 변경사항을 하나의 요청으로 묶음
- **압축**: 요청/응답 데이터 GZIP 압축
- **캐시 헤더**: 브라우저 캐시 활용

### 🎯 **렌더링 최적화**

- **세밀한 업데이트**: 변경된 부분만 리렌더링
- **메모이제이션**: 계산 결과 캐싱
- **가상화**: 큰 리스트의 가상 스크롤링 (향후 구현 예정)

## 🔍 디버깅 및 모니터링

### 📈 **로그 시스템**

```typescript
// 동기화 성공
console.log(`✅ Synced ${dateString} to server`);

// 동기화 실패
console.error(`❌ Failed to sync ${dateString}:`, error);

// 성능 모니터링
console.time(`sync-${dateString}`);
await syncToServer(dateString);
console.timeEnd(`sync-${dateString}`);
```

### 🔧 **개발자 도구**

브라우저 콘솔에서 다음 명령어로 상태 확인:

```javascript
// 현재 스토어 상태 확인
window.todoStore = useTodoStore.getState();
console.log(window.todoStore);

// 대기 중인 동기화 확인
console.log("Pending syncs:", window.todoStore.pendingSyncs);

// 강제 동기화
window.todoStore.syncAllPending();
```

## 🚀 향후 개선 계획

### 📋 **단기 계획**

- [ ] 오프라인 모드 지원
- [ ] 충돌 해결 메커니즘
- [ ] 실시간 다중 사용자 동기화
- [ ] 데이터 압축 최적화

### 🎯 **장기 계획**

- [ ] PWA (Progressive Web App) 지원
- [ ] 동기화 상태 시각화 UI
- [ ] 데이터 분석 및 인사이트
- [ ] 클라우드 백업 및 복원

---

## 📝 요약

Planit 캘린더의 데이터 관리 시스템은 **사용자 경험을 최우선**으로 하는 현대적인 웹 애플리케이션 아키텍처입니다:

1. **즉시 반응**: 모든 사용자 액션에 즉각적인 피드백
2. **지능적 동기화**: 디바운싱과 우선순위를 통한 효율적인 서버 통신
3. **안정성**: 네트워크 오류에도 견고한 사용자 경험
4. **확장성**: 미래의 기능 추가를 고려한 유연한 구조

이러한 설계를 통해 **로컬 앱과 같은 반응성**과 **클라우드의 안정성**을 모두 제공합니다. 🎉
