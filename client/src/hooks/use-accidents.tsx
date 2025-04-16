import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { Accident, InsertAccident } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AccidentManagementContextType = {
    accidents: Accident[] | undefined;
    isLoading: boolean;
    error: Error | null;
    createAccidentMutation: UseMutationResult<Accident, Error, InsertAccident>;
    updateAccidentMutation: UseMutationResult<Accident, Error, { id: number; data: Partial<InsertAccident> }>;
    deleteAccidentMutation: UseMutationResult<void, Error, number>;
};

export function useAccidents() {
    const { toast } = useToast();

    const {
        data: accidents,
        error,
        isLoading,
    } = useQuery<Accident[], Error>({
        queryKey: ["/api/accidents"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/accidents");
            return res.json();
        },
    });

    const createAccidentMutation = useMutation({
        mutationFn: async (accidentData: InsertAccident) => {
            const res = await apiRequest("POST", "/api/accidents", accidentData);
            return res.json();
        },
        onSuccess: (newAccident: Accident) => {
            queryClient.setQueryData<Accident[]>(["/api/accidents"], (old) =>
                old ? [...old, newAccident] : [newAccident]
            );
            toast({
                title: "사고 등록 성공",
                description: "사고가 등록되었습니다.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "사고 등록 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateAccidentMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAccident> }) => {
            const res = await apiRequest("PUT", `/api/accidents/${id}`, data);
            return res.json();
        },
        onSuccess: (updatedAccident: Accident) => {
            queryClient.setQueryData<Accident[]>(["/api/accidents"], (old) =>
                old
                    ? old.map((accident) => (accident.id === updatedAccident.id ? updatedAccident : accident))
                    : [updatedAccident]
            );
            toast({
                title: "사고 정보 업데이트 성공",
                description: "사고 정보가 수정되었습니다.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "사고 정보 업데이트 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteAccidentMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/accidents/${id}`);
        },
        onSuccess: (_, id) => {
            queryClient.setQueryData<Accident[]>(["/api/accidents"], (old) =>
                old ? old.filter((accident) => accident.id !== id) : []
            );
            toast({
                title: "사고 삭제 성공",
                description: "사고가 삭제되었습니다.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "사고 삭제 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        accidents,
        isLoading,
        error,
        createAccidentMutation,
        updateAccidentMutation,
        deleteAccidentMutation,
    };
}
