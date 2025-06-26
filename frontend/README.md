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
