// 테스트용 무작위 일정 데이터 생성기
// 브라우저 콘솔에서 실행하여 20개의 무작위 일정을 생성합니다.

function generateTestSchedules() {
  // 카테고리 및 색상 정의
  const categories = [
    { name: "업무", color: "#007bff" },
    { name: "개인", color: "#28a745" },
    { name: "운동", color: "#fd7e14" },
    { name: "공부", color: "#6f42c1" },
    { name: "기타", color: "#6c757d" },
  ];

  // 우선순위 정의
  const priorities = ["high", "medium", "low"];

  // 반복 설정
  const repeats = ["none", "daily", "weekly", "monthly"];

  // 샘플 일정 텍스트
  const todoTexts = [
    "프로젝트 기획서 작성",
    "팀 미팅 참석",
    "운동하기 - 헬스장",
    "영어 공부 1시간",
    "독서 - 자기계발서",
    "친구와 저녁 약속",
    "병원 검진 받기",
    "쇼핑 - 생필품 구매",
    "영화 관람",
    "요리 연습",
    "블로그 포스팅 작성",
    "온라인 강의 수강",
    "부모님께 안부 전화",
    "자동차 정기 점검",
    "도서관에서 공부",
    "요가 클래스 참석",
    "재정 관리 점검",
    "새로운 기술 학습",
    "정리정돈 - 방 청소",
    "명상 및 휴식",
    "동네 산책하기",
    "반려동물 돌보기",
    "온라인 쇼핑",
    "게임하기",
    "음악 감상",
    "사진 정리",
    "일기 쓰기",
    "빨래 및 세탁",
    "식재료 준비",
    "네트워킹 이벤트 참석"
  ];

  // 무작위 날짜 생성 함수 (현재 월 기준 ±2개월)
  function getRandomDate() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // -2개월 ~ +2개월 범위
    const randomMonthOffset = Math.floor(Math.random() * 5) - 2;
    const targetMonth = currentMonth + randomMonthOffset;
    
    let targetYear = currentYear;
    let finalMonth = targetMonth;
    
    if (targetMonth < 0) {
      targetYear = currentYear - 1;
      finalMonth = 12 + targetMonth;
    } else if (targetMonth > 11) {
      targetYear = currentYear + 1;
      finalMonth = targetMonth - 12;
    }
    
    // 해당 월의 마지막 날 계산
    const lastDay = new Date(targetYear, finalMonth + 1, 0).getDate();
    const randomDay = Math.floor(Math.random() * lastDay) + 1;
    
    return `${finalMonth + 1}월 ${randomDay}일`;
  }

  // 무작위 시간 생성
  function getRandomTime() {
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  // 무작위 일정 생성
  function createRandomTodo(id) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const repeat = repeats[Math.floor(Math.random() * repeats.length)];
    const text = todoTexts[Math.floor(Math.random() * todoTexts.length)];
    
    const hasTime = Math.random() > 0.5; // 50% 확률로 시간 설정
    const startTime = hasTime ? getRandomTime() : "";
    const endTime = hasTime ? (() => {
      const start = new Date(`2000-01-01 ${startTime}`);
      const duration = (Math.floor(Math.random() * 4) + 1) * 30; // 30분 ~ 2시간
      const end = new Date(start.getTime() + duration * 60000);
      return `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
    })() : "";

    return {
      id: id,
      text: text,
      completed: Math.random() > 0.7, // 30% 확률로 완료
      estimatedTime: Math.floor(Math.random() * 120) + 15, // 15분 ~ 135분
      startTime: startTime,
      endTime: endTime,
      repeat: repeat,
      category: category.name,
      color: category.color,
      priority: priority,
      order: 0
    };
  }

  console.log("🚀 테스트 일정 데이터 생성 중...");

  // 20개의 무작위 일정 생성
  const generatedDates = [];
  for (let i = 0; i < 20; i++) {
    const randomDate = getRandomDate();
    const existingTodos = JSON.parse(localStorage.getItem(`todos_${randomDate}`) || '[]');
    const newTodo = createRandomTodo(existingTodos.length);
    
    // 기존 일정에 추가
    existingTodos.push(newTodo);
    localStorage.setItem(`todos_${randomDate}`, JSON.stringify(existingTodos));
    
    // nextTodoId 업데이트
    localStorage.setItem(`nextTodoId_${randomDate}`, (existingTodos.length).toString());
    
    generatedDates.push({
      date: randomDate,
      todo: newTodo.text,
      category: newTodo.category,
      priority: newTodo.priority
    });

    console.log(`📅 ${randomDate}: ${newTodo.text} (${newTodo.category}, ${newTodo.priority})`);
  }

  // localStorage 변경 이벤트 발생
  window.dispatchEvent(new CustomEvent('local-storage-changed', {
    detail: { key: 'todos_test', date: 'test', todos: [] }
  }));

  console.log(`✅ 총 ${generatedDates.length}개의 테스트 일정이 생성되었습니다!`);
  console.log("📋 생성된 일정 요약:");
  
  // 카테고리별 요약
  const categorySummary = {};
  generatedDates.forEach(item => {
    categorySummary[item.category] = (categorySummary[item.category] || 0) + 1;
  });
  
  Object.entries(categorySummary).forEach(([category, count]) => {
    console.log(`   ${category}: ${count}개`);
  });

  console.log("\n🔄 페이지를 새로고침하시거나 메뉴를 열어서 확인해보세요!");
  
  return generatedDates;
}

// 실행
generateTestSchedules(); 