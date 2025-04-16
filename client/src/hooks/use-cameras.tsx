import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { Camera, InsertCamera } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type CameraManagementContextType = {
    cameras: Camera[] | undefined;
    isLoading: boolean;
    error: Error | null;
    createCameraMutation: UseMutationResult<Camera, Error, InsertCamera>;
    updateCameraMutation: UseMutationResult<Camera, Error, { id: number; data: Partial<InsertCamera> }>;
    deleteCameraMutation: UseMutationResult<void, Error, number>;
};

export function useCameras() {
    const { toast } = useToast();

    const {
        data: cameras,
        error,
        isLoading,
    } = useQuery<Camera[], Error>({
        queryKey: ["/api/cameras"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/cameras");
            return res.json();
        },
    });

    const createCameraMutation = useMutation({
        mutationFn: async (cameraData: InsertCamera) => {
            const res = await apiRequest("POST", "/api/cameras", cameraData);
            return res.json();
        },
        onSuccess: (newCamera: Camera) => {
            queryClient.setQueryData<Camera[]>(["/api/cameras"], (old) => (old ? [...old, newCamera] : [newCamera]));
            toast({
                title: "카메라 등록 성공",
                description: `${newCamera.name}이(가) 등록되었습니다.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "카메라 등록 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateCameraMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCamera> }) => {
            const res = await apiRequest("PUT", `/api/cameras/${id}`, data);
            return res.json();
        },
        onSuccess: (updatedCamera: Camera) => {
            queryClient.setQueryData<Camera[]>(["/api/cameras"], (old) =>
                old ? old.map((camera) => (camera.id === updatedCamera.id ? updatedCamera : camera)) : [updatedCamera]
            );
            toast({
                title: "카메라 정보 업데이트 성공",
                description: `${updatedCamera.name}의 정보가 수정되었습니다.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "카메라 정보 업데이트 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteCameraMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/cameras/${id}`);
        },
        onSuccess: (_, id) => {
            queryClient.setQueryData<Camera[]>(["/api/cameras"], (old) =>
                old ? old.filter((camera) => camera.id !== id) : []
            );
            toast({
                title: "카메라 삭제 성공",
                description: "카메라가 삭제되었습니다.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "카메라 삭제 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        cameras,
        isLoading,
        error,
        createCameraMutation,
        updateCameraMutation,
        deleteCameraMutation,
    };
}
