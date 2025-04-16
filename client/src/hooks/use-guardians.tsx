import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { Guardian, InsertGuardian } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type GuardianManagementContextType = {
    guardians: Guardian[] | undefined;
    isLoading: boolean;
    error: Error | null;
    createGuardianMutation: UseMutationResult<Guardian, Error, InsertGuardian>;
    updateGuardianMutation: UseMutationResult<Guardian, Error, { id: number; data: Partial<InsertGuardian> }>;
    deleteGuardianMutation: UseMutationResult<void, Error, number>;
};

export function useGuardians() {
    const { toast } = useToast();

    const {
        data: guardians,
        error,
        isLoading,
    } = useQuery<Guardian[], Error>({
        queryKey: ["/api/guardians"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/guardians");
            return res.json();
        },
    });

    const createGuardianMutation = useMutation({
        mutationFn: async (guardianData: InsertGuardian) => {
            const res = await apiRequest("POST", "/api/guardians", guardianData);
            return res.json();
        },
        onSuccess: (newGuardian: Guardian) => {
            queryClient.setQueryData<Guardian[]>(["/api/guardians"], (old) =>
                old ? [...old, newGuardian] : [newGuardian]
            );
            toast({
                title: "보호자 등록 성공",
                description: `${newGuardian.name}님이 등록되었습니다.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "보호자 등록 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateGuardianMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertGuardian> }) => {
            const res = await apiRequest("PUT", `/api/guardians/${id}`, data);
            return res.json();
        },
        onSuccess: (updatedGuardian: Guardian) => {
            queryClient.setQueryData<Guardian[]>(["/api/guardians"], (old) =>
                old
                    ? old.map((guardian) => (guardian.id === updatedGuardian.id ? updatedGuardian : guardian))
                    : [updatedGuardian]
            );
            toast({
                title: "보호자 정보 업데이트 성공",
                description: `${updatedGuardian.name}님의 정보가 수정되었습니다.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "보호자 정보 업데이트 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteGuardianMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/guardians/${id}`);
        },
        onSuccess: (_, id) => {
            queryClient.setQueryData<Guardian[]>(["/api/guardians"], (old) =>
                old ? old.filter((guardian) => guardian.id !== id) : []
            );
            toast({
                title: "보호자 삭제 성공",
                description: "보호자가 삭제되었습니다.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "보호자 삭제 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        guardians,
        isLoading,
        error,
        createGuardianMutation,
        updateGuardianMutation,
        deleteGuardianMutation,
    };
}
