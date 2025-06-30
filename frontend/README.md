## Vite 프록시 설정 가이드

### Proxy Rewrite 기능 설명

Vite의 프록시 `rewrite` 기능은 클라이언트 요청 경로를 서버로 전달하기 전에 **경로를 변환**하는 기능입니다.

#### 기본 동작 원리

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

#### Rewrite 적용 예시

| 클라이언트 요청     | Rewrite 적용 후 | 실제 서버 요청                       |
| ------------------- | --------------- | ------------------------------------ |
| `/api/users`        | `/users`        | `http://localhost:3000/users`        |
| `/api/health-check` | `/health-check` | `http://localhost:3000/health-check` |




### Calendar 개발정리

## Calendar 날짜 알고리즘
1. 마지막날짜의 인덱스
7일, 5주를 기준으로 달력을 작성
0~34의 index를 가진 배열로 해당 달력을 채울예정

이때 마지막날짜의 index가 필요했음
이걸 구하는방법은 해당 달의 첫번째날의 index와 해당 달이 몇일까지 있는지가 필요함

```
2025.6월1일은 일요일이다.
월요일은 index은 0
그렇다는건 index 0부터 6월의 시작이란 뜻
마지막날의 인덱스를 구하는 방법은 시작일의 index + (달의 마지막날짜 -1)이다. *여기서 -1은 배열의 특성상 0부터 시작되기때문에 -1을 해준것이다.

그렇다면 마지막 날짜의 계산 공식
마지막날짜의 index = 0(월요일index) + (30(달의 마지막날짜) - 1 (배열의 인덱스때문))
마지막날짜의 index = 29
```