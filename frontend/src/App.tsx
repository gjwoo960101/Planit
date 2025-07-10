import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Calendar from "./components/calendar/Calendar";
import { Login } from "./components/login/Login";
import { useTodoStore } from "./stores/todoStore";

function App() {
  const { initializeStore } = useTodoStore();

  // 앱 시작 시 스토어 초기화
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Calendar />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
