import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import FallDetectionPage from "@/pages/fall-detection-page";
import DashboardPage from "@/pages/dashboard-page";
import PatientDetailPage from "@/pages/patient-detail-page";
import AuthPage from "@/pages/auth-page";
import MyPage from "@/pages/my-page";
import AccountsManagementPage from "@/pages/accounts-management-page";
import RoomManagementPage from "@/pages/room-management-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { UserRole } from "@shared/schema";
import { I18nProvider } from "@/contexts/I18nContext";
import { useEffect } from "react";
import { 
  Home, 
  LayoutDashboard, 
  MonitorSmartphone, 
  Users, 
  Settings, 
  BedDouble, 
  Thermometer, 
  UserRound, 
  MessageCircle,
  Menu,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { useState } from "react";

// 임시 병실 및 환자 데이터
const ROOMS_DATA = [
  {
    id: 1,
    name: "101호",
    patients: [
      { id: 1, name: "김환자", age: 65, gender: "남", condition: "안정", fallRisk: "높음" },
      { id: 2, name: "이환자", age: 78, gender: "여", condition: "양호", fallRisk: "중간" }
    ]
  },
  {
    id: 2,
    name: "102호",
    patients: [
      { id: 3, name: "박환자", age: 72, gender: "남", condition: "주의", fallRisk: "높음" },
      { id: 4, name: "최환자", age: 68, gender: "여", condition: "안정", fallRisk: "낮음" },
      { id: 5, name: "정환자", age: 81, gender: "남", condition: "안정", fallRisk: "중간" }
    ]
  },
  {
    id: 3,
    name: "103호",
    patients: [
      { id: 6, name: "강환자", age: 75, gender: "여", condition: "안정", fallRisk: "낮음" },
      { id: 7, name: "윤환자", age: 69, gender: "남", condition: "주의", fallRisk: "높음" }
    ]
  }
];

function SidebarMenuItem({ icon: Icon, label, active, href, onClick }: { 
  icon: any, 
  label: string, 
  active?: boolean,
  href?: string,
  onClick?: () => void
}) {
  return (
    <a 
      href={href} 
      onClick={onClick}
      className={cn(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active 
          ? "bg-primary/10 text-primary" 
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <Icon className="mr-2 h-4 w-4" />
      <span>{label}</span>
    </a>
  );
}

function RoomItem({ room }: { room: typeof ROOMS_DATA[0] }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded-md"
      >
        <div className="flex items-center">
          <BedDouble className="mr-2 h-4 w-4 text-gray-500" />
          <span>{room.name}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="pl-6 mt-1 space-y-1">
          {room.patients.map(patient => (
            <a 
              key={patient.id} 
              href={`/patients/${patient.id}`}
              className="flex items-center px-2 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100"
            >
              <UserRound className="mr-2 h-3.5 w-3.5 text-gray-500" />
              <span>{patient.name}</span>
              <span className={cn(
                "ml-auto text-xs rounded-full px-1.5 py-0.5",
                patient.fallRisk === "높음" ? "bg-red-100 text-red-800" :
                patient.fallRisk === "중간" ? "bg-yellow-100 text-yellow-800" :
                "bg-green-100 text-green-800"
              )}>
                {patient.fallRisk}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomList() {
  return (
    <div className="space-y-1 mt-2">
      {ROOMS_DATA.map(room => (
        <RoomItem key={room.id} room={room} />
      ))}
    </div>
  );
}

function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  if (!user) return null;
  
  // 역할에 따른 메뉴 권한 설정
  const canAccessUserManagement = user.role === UserRole.DIRECTOR || user.role === UserRole.NURSE;
  const canAccessRoomManagement = user.role === UserRole.DIRECTOR || user.role === UserRole.NURSE;
  
  return (
    <div className="hidden md:flex h-full w-60 flex-col bg-white border-r border-gray-200">
      <div className="p-4">
        <h2 className="text-lg font-semibold">스마트 케어</h2>
        <p className="text-sm text-gray-500">병원 관리 시스템</p>
      </div>
      
      <div className="flex-1 px-3 py-2 space-y-1">
        <SidebarMenuItem 
          icon={Home} 
          label="홈" 
          href="/" 
          active={location === '/'} 
        />
        <SidebarMenuItem 
          icon={LayoutDashboard} 
          label="대시보드" 
          href="/dashboard" 
          active={location === '/dashboard'} 
        />
        <SidebarMenuItem 
          icon={MonitorSmartphone} 
          label="낙상 감지" 
          href="/fall-detection" 
          active={location === '/fall-detection'} 
        />
        <SidebarMenuItem 
          icon={Thermometer} 
          label="환경 모니터링" 
          href="/environment" 
          active={location === '/environment'} 
        />
        
        {canAccessRoomManagement && (
          <div className="mt-6 pt-4 border-t">
            <div className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              병실 및 환자 관리
            </div>
            <SidebarMenuItem
              icon={BedDouble}
              label="병실 관리"
              href="/room-management"
              active={location === '/room-management'}
              onClick={() => {
                console.log("병실 관리 클릭됨");
                const token = localStorage.getItem('token');
                console.log("현재 토큰 상태:", token ? "토큰 있음" : "토큰 없음");
              }}
            />
            <div className="mt-2">
              <RoomList />
            </div>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t">
          {canAccessUserManagement && (
            <SidebarMenuItem 
              icon={Users} 
              label="계정 관리" 
              href="/accounts" 
              active={location === '/accounts'} 
            />
          )}
          <SidebarMenuItem 
            icon={UserRound} 
            label="마이페이지" 
            href="/mypage" 
            active={location === '/mypage'} 
          />
          <SidebarMenuItem 
            icon={MessageCircle} 
            label="메시지" 
            href="/messages" 
            active={location === '/messages'} 
          />
          <SidebarMenuItem 
            icon={Settings} 
            label="설정" 
            href="/settings" 
            active={location === '/settings'} 
          />
        </div>
      </div>
      
      <div className="p-3 border-t">
        <div className="px-3 py-2 mb-2 flex items-center">
          <UserRound className="h-5 w-5 mr-2 text-gray-500" />
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">
              {user.role === UserRole.DIRECTOR ? "병원장" : 
               user.role === UserRole.NURSE ? "간호사" : 
               user.role === UserRole.PATIENT ? "환자" : "보호자"}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-gray-700"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
        </Button>
      </div>
    </div>
  );
}

function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <button 
      className="md:hidden p-2 mr-2 rounded-md hover:bg-gray-100"
      onClick={() => setIsOpen(!isOpen)}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

function Header() {
  return (
    <header className="bg-white border-b shadow-sm p-4 md:p-6">
      <div className="container mx-auto flex items-center">
        <MobileSidebar />
        <span className="text-xl font-bold text-primary md:hidden">스마트 케어</span>
      </div>
    </header>
  );
}

function HomePage() {
  return (
    <div className="p-8 max-w-screen-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">병원 모니터링 시스템</h1>
      <p className="mb-6">환영합니다. 이 시스템은 환자의 낙상 사고를 감지하고 환경을 모니터링합니다.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow-sm border">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <MonitorSmartphone className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="font-bold mb-2">낙상 감지</h2>
          <p className="text-sm text-gray-600 mb-4">AI 기술을 활용한 실시간 환자 낙상 감지 시스템입니다.</p>
          <a href="/fall-detection" className="text-sm text-primary font-medium">낙상 감지 페이지 &rarr;</a>
        </div>
        
        <div className="bg-white p-4 rounded shadow-sm border">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
            <LayoutDashboard className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="font-bold mb-2">대시보드</h2>
          <p className="text-sm text-gray-600 mb-4">병원 전체 현황과 환자 상태를 모니터링하는 대시보드입니다.</p>
          <a href="/dashboard" className="text-sm text-primary font-medium">대시보드 확인 &rarr;</a>
        </div>
        
        <div className="bg-white p-4 rounded shadow-sm border">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <Home className="h-5 w-5 text-green-600" />
          </div>
          <h2 className="font-bold mb-2">환경 모니터링</h2>
          <p className="text-sm text-gray-600 mb-4">병실 환경을 모니터링하고 이상 상황을 감지합니다.</p>
          <a href="/environment" className="text-sm text-primary font-medium">환경 모니터링 &rarr;</a>
        </div>
      </div>
    </div>
  );
}

// 무한 리디렉션 방지를 위한 초기화 함수
function clearRedirectState() {
  try {
    // 페이지 로드 시 리디렉션 시도 카운터 초기화
    sessionStorage.removeItem('redirectAttempt');
    
    // 토큰 사전 확인 (로그인 화면/메인 화면 판단용)
    const token = localStorage.getItem('token');
    if (token) {
      // JWT 디코딩 및 유효성 검사 (간단한 방법)
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          const expiry = payload.exp * 1000; // 초를 밀리초로 변환
          const now = Date.now();
          
          if (now >= expiry) {
            // 만료된 토큰은 제거
            console.log("만료된 토큰 발견, 제거함");
            localStorage.removeItem('token');
          }
        } catch (e) {
          // 토큰 구문 분석 실패 시 제거
          console.error("토큰 디코딩 오류, 제거함:", e);
          localStorage.removeItem('token');
        }
      } else {
        // 잘못된 형식의 토큰은 제거
        localStorage.removeItem('token');
      }
    }
  } catch (error) {
    console.error("초기화 중 오류:", error);
  }
}

function App() {
  // 앱 시작 시 무한 리디렉션 방지 로직 실행
  useEffect(() => {
    clearRedirectState();
  }, []);
  
  return (
    <AuthProvider>
      <I18nProvider>
        <div className="min-h-screen bg-gray-50 flex">
          <Sidebar />
          
          <div className="flex-1 flex flex-col">
            <Header />
            
            <main className="flex-1 overflow-auto">
              <Switch>
                <Route path="/auth" component={AuthPage} />
                <ProtectedRoute path="/" component={HomePage} />
                <ProtectedRoute path="/dashboard" component={DashboardPage} />
                <ProtectedRoute path="/fall-detection" component={FallDetectionPage} />
                <ProtectedRoute path="/patients/:id" component={PatientDetailPage} />
                <ProtectedRoute path="/mypage" component={MyPage} />
                <ProtectedRoute 
                  path="/accounts" 
                  component={AccountsManagementPage} 
                  roles={[UserRole.DIRECTOR, UserRole.NURSE]} 
                />
                <ProtectedRoute 
                  path="/room-management" 
                  component={RoomManagementPage}
                  roles={[UserRole.DIRECTOR, UserRole.NURSE]}
                />
                <ProtectedRoute path="/messages" component={() => <div className="p-8">메시지 - 구현 중</div>} />
                <ProtectedRoute path="/settings" component={() => <div className="p-8">설정 - 구현 중</div>} />
                <Route component={NotFound} />
              </Switch>
            </main>
            
            <footer className="bg-white border-t py-4 mt-8">
              <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                © 2025 스마트 케어 시스템. All rights reserved.
              </div>
            </footer>
          </div>
        </div>
        <Toaster />
      </I18nProvider>
    </AuthProvider>
  );
}

export default App;