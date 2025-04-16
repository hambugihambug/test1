import { createContext, useState, ReactNode, useContext, useEffect } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { InsertUser, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    loginMutation: UseMutationResult<User, Error, LoginData>;
    logoutMutation: UseMutationResult<void, Error, void>;
    registerMutation: UseMutationResult<User, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [initialChecked, setInitialChecked] = useState(false);

    // 페이지 로드 시 필요한 로직
    useEffect(() => {
        const checkLoggedInStatus = async () => {
            try {
                // 쿠키 기반 인증 확인
                const response = await fetch("/api/user", {
                    credentials: "include", // 쿠키 포함
                });

                if (response.ok) {
                    const userData = await response.json();
                    console.log("사용자 데이터 로드됨:", userData.username, userData.role);
                    queryClient.setQueryData(["/api/user"], userData);

                    // 인증 페이지에 있다면 홈으로 리디렉트
                    if (window.location.pathname === "/auth") {
                        setLocation("/");
                    }
                } else {
                    console.error("사용자 데이터 로드 실패:", response.status);

                    if (window.location.pathname !== "/auth") {
                        console.log("인증 실패로 인한 리디렉션");
                        setLocation("/auth");
                    }
                }
                setInitialChecked(true);
            } catch (error) {
                console.error("세션 확인 중 오류 발생:", error);
                setInitialChecked(true);
                setLocation("/auth");
            }
        };

        checkLoggedInStatus();
    }, [setLocation]);

    const {
        data: user,
        error,
        isLoading,
    } = useQuery<User | undefined, Error>({
        queryKey: ["/api/user"],
        queryFn: async () => {
            try {
                const response = await fetch("/api/user", {
                    credentials: "include", // 쿠키 포함
                });

                if (!response.ok) {
                    console.log("사용자 정보 로드 실패:", response.status);
                    return null;
                }

                const userData = await response.json();
                console.log("사용자 정보 로드 성공:", userData.username, userData.role);
                return userData;
            } catch (error) {
                console.error("사용자 정보 로드 오류:", error);
                return null;
            }
        },
        enabled: initialChecked,
    });

    const loginMutation = useMutation({
        mutationFn: async (credentials: LoginData) => {
            try {
                const res = await apiRequest("POST", "/api/login", credentials);
                const userData = await res.json();

                // 서버가 쿠키를 자동으로 설정하므로, 토큰을 별도로 저장할 필요가 없음
                // 이전 리디렉션 시도 횟수 초기화
                sessionStorage.removeItem("redirectAttempt");

                return userData;
            } catch (error) {
                console.error("로그인 중 오류 발생:", error);
                throw error;
            }
        },
        onSuccess: (user: User) => {
            console.log("로그인 성공, 사용자 정보:", user.username);

            // 명시적으로 쿼리 캐시 업데이트
            queryClient.setQueryData(["/api/user"], user);

            toast({
                title: "로그인 성공",
                description: `${user.name}님 환영합니다!`,
            });

            // 지연을 주어 상태 업데이트가 완료된 후 페이지 이동
            setTimeout(() => {
                console.log("메인 페이지로 이동합니다");
                window.location.href = "/";
            }, 1000);
        },
        onError: (error: Error) => {
            let errorMessage = "로그인에 실패했습니다";

            if (error.message.includes("Unauthorized") || error.message.includes("401")) {
                errorMessage = "아이디 또는 비밀번호가 올바르지 않습니다";
            }

            toast({
                title: "로그인 실패",
                description: errorMessage,
                variant: "destructive",
            });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (credentials: InsertUser) => {
            const res = await apiRequest("POST", "/api/register", credentials);
            const userData = await res.json();
            return userData;
        },
        onSuccess: (user: User) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({
                title: "회원가입 성공",
                description: "계정이 성공적으로 생성되었습니다.",
            });
            // 회원가입 성공 시 메인 페이지로 이동
            setLocation("/");
        },
        onError: (error: Error) => {
            toast({
                title: "회원가입 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/logout");
        },
        onSuccess: () => {
            queryClient.setQueryData(["/api/user"], null);
            toast({
                title: "로그아웃 되었습니다",
            });
            // 로그아웃 성공 시 로그인 페이지로 이동
            setLocation("/auth");
        },
        onError: (error: Error) => {
            toast({
                title: "로그아웃 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isLoading,
                error,
                loginMutation,
                logoutMutation,
                registerMutation,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
