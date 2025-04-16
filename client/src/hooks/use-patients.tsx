import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { Patient, InsertPatient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type PatientManagementContextType = {
    patients: Patient[] | undefined;
    isLoading: boolean;
    error: Error | null;
    createPatientMutation: UseMutationResult<Patient, Error, InsertPatient>;
    updatePatientMutation: UseMutationResult<Patient, Error, { id: number; data: Partial<InsertPatient> }>;
    deletePatientMutation: UseMutationResult<void, Error, number>;
};

export function usePatients() {
    const { toast } = useToast();

    const {
        data: patients,
        error,
        isLoading,
    } = useQuery<Patient[], Error>({
        queryKey: ["/api/patients"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/patients");
            return res.json();
        },
    });

    const createPatientMutation = useMutation({
        mutationFn: async (patientData: InsertPatient) => {
            const res = await apiRequest("POST", "/api/patients", patientData);
            return res.json();
        },
        onSuccess: (newPatient: Patient) => {
            queryClient.setQueryData<Patient[]>(["/api/patients"], (old) =>
                old ? [...old, newPatient] : [newPatient]
            );
            toast({
                title: "환자 등록 성공",
                description: `${newPatient.name}님이 등록되었습니다.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "환자 등록 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updatePatientMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPatient> }) => {
            const res = await apiRequest("PUT", `/api/patients/${id}`, data);
            return res.json();
        },
        onSuccess: (updatedPatient: Patient) => {
            queryClient.setQueryData<Patient[]>(["/api/patients"], (old) =>
                old
                    ? old.map((patient) => (patient.id === updatedPatient.id ? updatedPatient : patient))
                    : [updatedPatient]
            );
            toast({
                title: "환자 정보 업데이트 성공",
                description: `${updatedPatient.name}님의 정보가 수정되었습니다.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "환자 정보 업데이트 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deletePatientMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/patients/${id}`);
        },
        onSuccess: (_, id) => {
            queryClient.setQueryData<Patient[]>(["/api/patients"], (old) =>
                old ? old.filter((patient) => patient.id !== id) : []
            );
            toast({
                title: "환자 삭제 성공",
                description: "환자가 삭제되었습니다.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "환자 삭제 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        patients,
        isLoading,
        error,
        createPatientMutation,
        updatePatientMutation,
        deletePatientMutation,
    };
}
