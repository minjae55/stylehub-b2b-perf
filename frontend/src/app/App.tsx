import {RouterProvider} from "react-router";
import {router} from "./routes";
import {useAuthStore} from "@/store/useAuthStore";
import {useEffect} from "react";
import {getMe} from "@/api/auth";

export default function App() {
  // setLoading을 함께 구조분해로 꺼냅니다.
  const {setUser, clearUser, setLoading, isLoading} = useAuthStore();

  useEffect(() => {
    // 앱 처음 켜질 때 쿠키 기반으로 로그인 상태 확인
    getMe()
        .then((user) => setUser(user))
        .catch(() => clearUser())
        // 실패(비로그인)하더라도 로딩 스피너를 걷어내고 라우터 화면으로 보내줍니다.
        .finally(() => setLoading(false));
  }, [setUser, clearUser, setLoading]);

  // 로딩 중엔 깜빡임 방지용 스피너
  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
          로딩 중...
        </div>
    );
  }
  return <RouterProvider router={router} />;
}
