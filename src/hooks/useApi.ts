import { useCallback, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteCreation,
  generateArticle,
  generateImage,
  generateTitles,
  getAdminStats,
  getApiErrorMessage,
  getCreations,
  removeBackground,
  removeObject,
  reviewResume,
  type AuthToken,
  type DeleteCreationPayload,
  type DeleteCreationResult,
  type GenerateArticlePayload,
  type GenerateArticleResult,
  type GenerateImagePayload,
  type GenerateImageResult,
  type GenerateTitlesPayload,
  type GenerateTitlesResult,
  type GetCreationsParams,
  type GetCreationsResult,
  type RemoveBackgroundPayload,
  type RemoveBackgroundResult,
  type RemoveObjectPayload,
  type RemoveObjectResult,
  type ReviewResumePayload,
  type ReviewResumeResult,
} from "../lib/api";
import {
  GENERIC_ERROR_MESSAGE,
  TOAST_MESSAGES,
} from "../lib/constants";
import type { ToolType } from "../lib/utils";

export const queryKeys = {
  all: ["quickai"] as const,

  creations: {
    all: ["quickai", "creations"] as const,
    list: (params?: GetCreationsParams) =>
      ["quickai", "creations", "list", params ?? {}] as const,
    byTool: (toolType: ToolType) =>
      ["quickai", "creations", "tool", toolType] as const,
  },

  admin: {
    all: ["quickai", "admin"] as const,
    stats: ["quickai", "admin", "stats"] as const,
  },
};

type UseApiMutationConfig<TData, TVariables> = {
  token?: AuthToken;
  successMessage?: string;
  errorMessage?: string;
  invalidateKeys?: readonly QueryKey[];
  options?: Omit<
    UseMutationOptions<TData, Error, TVariables>,
    "mutationFn" | "onSuccess" | "onError"
  >;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
};

type MutationWithToken<TData, TVariables> = (
  variables: TVariables,
  token?: AuthToken,
) => Promise<TData>;

function useApiMutation<TData, TVariables>(
  mutationFn: MutationWithToken<TData, TVariables>,
  config: UseApiMutationConfig<TData, TVariables> = {},
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    ...config.options,
    mutationFn: (variables) => mutationFn(variables, config.token),
    onSuccess: async (data, variables) => {
      if (config.successMessage) {
        toast.success(config.successMessage);
      }

      if (config.invalidateKeys?.length) {
        await Promise.all(
          config.invalidateKeys.map((key) =>
            queryClient.invalidateQueries({ queryKey: key }),
          ),
        );
      }

      config.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      toast.error(config.errorMessage || getApiErrorMessage(error));
      config.onError?.(error, variables);
    },
  });
}

export function useGenerateArticle(
  token?: AuthToken,
  config?: UseApiMutationConfig<GenerateArticleResult, GenerateArticlePayload>,
) {
  return useApiMutation<GenerateArticleResult, GenerateArticlePayload>(
    generateArticle,
    {
      token,
      successMessage: TOAST_MESSAGES.generationCompleted,
      errorMessage: TOAST_MESSAGES.generationFailed,
      invalidateKeys: [queryKeys.creations.all],
      ...config,
    },
  );
}

export function useGenerateTitles(
  token?: AuthToken,
  config?: UseApiMutationConfig<GenerateTitlesResult, GenerateTitlesPayload>,
) {
  return useApiMutation<GenerateTitlesResult, GenerateTitlesPayload>(
    generateTitles,
    {
      token,
      successMessage: TOAST_MESSAGES.generationCompleted,
      errorMessage: TOAST_MESSAGES.generationFailed,
      invalidateKeys: [queryKeys.creations.all],
      ...config,
    },
  );
}

export function useGenerateImage(
  token?: AuthToken,
  config?: UseApiMutationConfig<GenerateImageResult, GenerateImagePayload>,
) {
  return useApiMutation<GenerateImageResult, GenerateImagePayload>(
    generateImage,
    {
      token,
      successMessage: TOAST_MESSAGES.generationCompleted,
      errorMessage: TOAST_MESSAGES.generationFailed,
      invalidateKeys: [queryKeys.creations.all],
      ...config,
    },
  );
}

export function useRemoveBackground(
  token?: AuthToken,
  config?: UseApiMutationConfig<
    RemoveBackgroundResult,
    RemoveBackgroundPayload
  >,
) {
  return useApiMutation<RemoveBackgroundResult, RemoveBackgroundPayload>(
    removeBackground,
    {
      token,
      successMessage: TOAST_MESSAGES.generationCompleted,
      errorMessage: TOAST_MESSAGES.generationFailed,
      invalidateKeys: [queryKeys.creations.all],
      ...config,
    },
  );
}

export function useRemoveObject(
  token?: AuthToken,
  config?: UseApiMutationConfig<RemoveObjectResult, RemoveObjectPayload>,
) {
  return useApiMutation<RemoveObjectResult, RemoveObjectPayload>(removeObject, {
    token,
    successMessage: TOAST_MESSAGES.generationCompleted,
    errorMessage: TOAST_MESSAGES.generationFailed,
    invalidateKeys: [queryKeys.creations.all],
    ...config,
  });
}

export function useReviewResume(
  token?: AuthToken,
  config?: UseApiMutationConfig<ReviewResumeResult, ReviewResumePayload>,
) {
  return useApiMutation<ReviewResumeResult, ReviewResumePayload>(reviewResume, {
    token,
    successMessage: TOAST_MESSAGES.generationCompleted,
    errorMessage: TOAST_MESSAGES.generationFailed,
    invalidateKeys: [queryKeys.creations.all],
    ...config,
  });
}

export function useCreations(
  params: GetCreationsParams = {},
  token?: AuthToken,
  options?: Omit<
    UseQueryOptions<GetCreationsResult, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<GetCreationsResult, Error>({
    queryKey: queryKeys.creations.list(params),
    queryFn: () => getCreations(params, token),
    enabled: Boolean(token) && (options?.enabled ?? true),
    staleTime: 1000 * 60,
    ...options,
  });
}

export function useDeleteCreation(
  token?: AuthToken,
  config?: UseApiMutationConfig<DeleteCreationResult, DeleteCreationPayload>,
) {
  return useApiMutation<DeleteCreationResult, DeleteCreationPayload>(
    deleteCreation,
    {
      token,
      successMessage: TOAST_MESSAGES.deleted,
      errorMessage: GENERIC_ERROR_MESSAGE,
      invalidateKeys: [queryKeys.creations.all],
      ...config,
    },
  );
}

export function useAdminStats(
  token?: AuthToken,
  options?: Omit<UseQueryOptions<Awaited<ReturnType<typeof getAdminStats>>, Error>, "queryKey" | "queryFn">,
) {
  return useQuery<Awaited<ReturnType<typeof getAdminStats>>, Error>({
    queryKey: queryKeys.admin.stats,
    queryFn: () => getAdminStats(token),
    enabled: Boolean(token) && (options?.enabled ?? true),
    staleTime: 1000 * 60,
    ...options,
  });
}

export function useApiStatus() {
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const start = useCallback((nextMessage = TOAST_MESSAGES.generationStarted) => {
    setMessage(nextMessage);
    setProgress(12);
  }, []);

  const update = useCallback((nextProgress: number, nextMessage?: string) => {
    setProgress(Math.min(Math.max(nextProgress, 0), 100));

    if (nextMessage) {
      setMessage(nextMessage);
    }
  }, []);

  const finish = useCallback((nextMessage = TOAST_MESSAGES.generationCompleted) => {
    setMessage(nextMessage);
    setProgress(100);
  }, []);

  const fail = useCallback((nextMessage = TOAST_MESSAGES.generationFailed) => {
    setMessage(nextMessage);
    setProgress(0);
  }, []);

  const reset = useCallback(() => {
    setMessage(null);
    setProgress(0);
  }, []);

  return {
    message,
    progress,
    isActive: progress > 0 && progress < 100,
    start,
    update,
    finish,
    fail,
    reset,
  };
}

export function useFilePreview() {
  const [file, setFileState] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const setFile = useCallback((nextFile: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFileState(nextFile);

    if (nextFile) {
      setPreviewUrl(URL.createObjectURL(nextFile));
    } else {
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const clearFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFileState(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  return {
    file,
    previewUrl,
    hasFile: Boolean(file),
    setFile,
    clearFile,
  };
}

export function useOptimisticTextResult() {
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const saveResult = useCallback((nextResult: string) => {
    setResult(nextResult);
    setHistory((current) => [nextResult, ...current].slice(0, 8));
  }, []);

  const clearResult = useCallback(() => {
    setResult("");
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    result,
    history,
    hasResult: result.trim().length > 0,
    saveResult,
    clearResult,
    clearHistory,
  };
}

export function useOptimisticImageResult() {
  const [imageUrl, setImageUrl] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const saveImage = useCallback((nextImageUrl: string) => {
    setImageUrl(nextImageUrl);
    setHistory((current) => [nextImageUrl, ...current].slice(0, 8));
  }, []);

  const clearImage = useCallback(() => {
    setImageUrl("");
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    imageUrl,
    history,
    hasImage: imageUrl.trim().length > 0,
    saveImage,
    clearImage,
    clearHistory,
  };
}

export function useToolLoadingText(toolType: ToolType, isLoading: boolean) {
  return useMemo(() => {
    if (!isLoading) return null;

    const loadingText: Record<ToolType, string> = {
      article: "Writing your article...",
      "blog-title": "Creating catchy title ideas...",
      image: "Generating your image...",
      "background-removal": "Removing the background...",
      "object-removal": "Removing the selected object...",
      "resume-review": "Reviewing your resume...",
    };

    return loadingText[toolType];
  }, [toolType, isLoading]);
}

export function useMutationToast() {
  const loading = useCallback((message = TOAST_MESSAGES.generationStarted) => {
    return toast.loading(message);
  }, []);

  const success = useCallback((toastId?: string | number, message = TOAST_MESSAGES.generationCompleted) => {
    if (toastId) {
      toast.success(message, { id: toastId });
      return;
    }

    toast.success(message);
  }, []);

  const error = useCallback((toastId?: string | number, message = TOAST_MESSAGES.generationFailed) => {
    if (toastId) {
      toast.error(message, { id: toastId });
      return;
    }

    toast.error(message);
  }, []);

  const info = useCallback((message: string) => {
    toast.info(message);
  }, []);

  return {
    loading,
    success,
    error,
    info,
  };
}