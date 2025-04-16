import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
    if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
    }
}

export async function apiRequest(method: string, url: string, data?: unknown | undefined): Promise<Response> {
    // 기본 헤더 설정
    const headers: HeadersInit = {
        ...(data ? { "Content-Type": "application/json" } : {}),
    };

    console.log(`API 요청 (${method} ${url})`);

    const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include", // 쿠키 사용
    });

    if (!res.ok) {
        console.error(`API 오류 (${method} ${url}):`, res.status, res.statusText);

        // 401 오류 처리 (권한 없음)
        if (res.status === 401) {
            console.error("API 요청 401 오류 - 인증 실패. 로그인 페이지로 이동");

            // 로그인 페이지가 아닌 경우에만 리디렉션
            if (window.location.pathname !== "/auth") {
                window.location.href = "/auth";
            }
        }
    }

    await throwIfResNotOk(res);
    return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
    ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const headers: HeadersInit = {};

        console.log(`쿼리 요청 시작: ${url}`);

        const res = await fetch(url, {
            headers,
            credentials: "include", // 쿠키 사용
        });

        console.log(`쿼리 응답 (${url}):`, res.status);

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
            console.log("401 응답 처리: null 반환");
            return null;
        }

        try {
            await throwIfResNotOk(res);
            const data = await res.json();
            return data;
        } catch (error) {
            console.error(`쿼리 오류 (${url}):`, error);

            // 401 오류 처리
            if (res.status === 401 && window.location.pathname !== "/auth") {
                console.error("인증 오류로 인한 리디렉션");
                window.location.href = "/auth";
            }

            throw error;
        }
    };

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryFn({ on401: "returnNull" }), // 401 오류는 null 반환으로 처리하여 앱이 충돌하지 않게 함
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
