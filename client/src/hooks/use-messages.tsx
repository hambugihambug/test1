import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { Message, InsertMessage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type MessageManagementContextType = {
    messages: Message[] | undefined;
    isLoading: boolean;
    error: Error | null;
    createMessageMutation: UseMutationResult<Message, Error, InsertMessage>;
    updateMessageMutation: UseMutationResult<Message, Error, { id: number; data: Partial<InsertMessage> }>;
    deleteMessageMutation: UseMutationResult<void, Error, number>;
};

export function useMessages() {
    const { toast } = useToast();

    const {
        data: messages,
        error,
        isLoading,
    } = useQuery<Message[], Error>({
        queryKey: ["/api/messages"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/messages");
            return res.json();
        },
    });

    const createMessageMutation = useMutation({
        mutationFn: async (messageData: InsertMessage) => {
            const res = await apiRequest("POST", "/api/messages", messageData);
            return res.json();
        },
        onSuccess: (newMessage: Message) => {
            queryClient.setQueryData<Message[]>(["/api/messages"], (old) =>
                old ? [...old, newMessage] : [newMessage]
            );
            toast({
                title: "메시지 전송 성공",
                description: "메시지가 전송되었습니다.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "메시지 전송 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateMessageMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMessage> }) => {
            const res = await apiRequest("PUT", `/api/messages/${id}`, data);
            return res.json();
        },
        onSuccess: (updatedMessage: Message) => {
            queryClient.setQueryData<Message[]>(["/api/messages"], (old) =>
                old
                    ? old.map((message) => (message.id === updatedMessage.id ? updatedMessage : message))
                    : [updatedMessage]
            );
            toast({
                title: "메시지 업데이트 성공",
                description: "메시지가 수정되었습니다.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "메시지 업데이트 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMessageMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/messages/${id}`);
        },
        onSuccess: (_, id) => {
            queryClient.setQueryData<Message[]>(["/api/messages"], (old) =>
                old ? old.filter((message) => message.id !== id) : []
            );
            toast({
                title: "메시지 삭제 성공",
                description: "메시지가 삭제되었습니다.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "메시지 삭제 실패",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        messages,
        isLoading,
        error,
        createMessageMutation,
        updateMessageMutation,
        deleteMessageMutation,
    };
}
