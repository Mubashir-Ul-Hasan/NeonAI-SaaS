import { useAuth } from "@clerk/clerk-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import {
  deleteCreation,
  getApiErrorMessage,
  getCreations,
  type CreationStatus,
  type DeleteCreationInput,
  type DeleteCreationResponse,
  type GetCreationsParams,
  type GetCreationsResponse,
  type PublicCreation,
  type ToolType,
} from "../lib/api";

export type CreationFilters = {
  page?: number;
  limit?: number;
  toolType?: ToolType | "all";
  status?: CreationStatus | "all";
  search?: string;
  includeFailed?: boolean;
};

export type UseCreationsOptions = {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
};

export const creationKeys = {
  all: ["creations"] as const,
  lists: () => [...creationKeys.all, "list"] as const,
  list: (params: GetCreationsParams) =>
    [...creationKeys.lists(), params] as const,
  details: () => [...creationKeys.all, "detail"] as const,
  detail: (creationId: string) =>
    [...creationKeys.details(), creationId] as const,
};

export function useCreations(
  filters: CreationFilters = {},
  options: UseCreationsOptions = {},
) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const params = normalizeCreationFilters(filters);

  return useQuery({
    queryKey: creationKeys.list(params),
    enabled: Boolean(isLoaded && isSignedIn && (options.enabled ?? true)),
    staleTime: options.staleTime ?? 1000 * 30,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    queryFn: async () => {
      const token = await getToken();

      return getCreations(params, {
        token,
      });
    },
  });
}

export function useRecentCreations(limit = 6) {
  return useCreations({
    page: 1,
    limit,
  });
}

export function useFavoriteCreations(limit = 20) {
  const creationsQuery = useCreations({
    page: 1,
    limit,
    includeFailed: false,
  });

  const favoriteCreations =
    creationsQuery.data?.creations.filter((creation) => creation.isFavorite) ??
    [];

  return {
    ...creationsQuery,
    favoriteCreations,
  };
}

export function useCreationsByTool(toolType: ToolType, limit = 12) {
  return useCreations({
    page: 1,
    limit,
    toolType,
  });
}

export function useDeleteCreation(
  options: UseMutationOptions<
    DeleteCreationResponse,
    Error,
    DeleteCreationInput
  > = {},
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteCreationInput) => {
      const token = await getToken();

      return deleteCreation(input, {
        token,
      });
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
  await queryClient.invalidateQueries({
    queryKey: creationKeys.all,
  });

  await options.onSuccess?.(data, variables, onMutateResult, context);
},
    onError: options.onError,
    onSettled: options.onSettled,
    onMutate: options.onMutate,
  });
}

export function useCreationFromCache(creationId: string | undefined) {
  const queryClient = useQueryClient();

  if (!creationId) return null;

  const queries = queryClient.getQueriesData<GetCreationsResponse>({
    queryKey: creationKeys.lists(),
  });

  for (const [, data] of queries) {
    const foundCreation = data?.creations.find(
      (creation) => creation.id === creationId,
    );

    if (foundCreation) {
      return foundCreation;
    }
  }

  return null;
}

export function useCreationStats(filters: CreationFilters = {}) {
  const creationsQuery = useCreations(filters);

  return {
    ...creationsQuery,
    counts: creationsQuery.data?.counts ?? {
      total: 0,
      completed: 0,
      processing: 0,
      failed: 0,
      favorites: 0,
    },
    usage: creationsQuery.data?.usage ?? null,
    pagination: creationsQuery.data?.pagination ?? null,
  };
}

export function getCreationPreview(creation: PublicCreation): string {
  if (creation.resultText?.trim()) {
    return creation.resultText.trim();
  }

  if (creation.resultImageUrl) {
    return creation.resultImageUrl;
  }

  if (creation.errorMessage?.trim()) {
    return creation.errorMessage.trim();
  }

  return creation.prompt;
}

export function getCreationTitle(creation: PublicCreation): string {
  const metadataTitle = creation.metadata.title;

  if (typeof metadataTitle === "string" && metadataTitle.trim()) {
    return metadataTitle.trim();
  }

  if (creation.toolType === "article") return "Generated Article";
  if (creation.toolType === "blog-title") return "Blog Titles";
  if (creation.toolType === "image") return "Generated Image";
  if (creation.toolType === "background-removal") return "Background Removed";
  if (creation.toolType === "object-removal") return "Object Removed";
  if (creation.toolType === "resume-review") return "Resume Review";

  return "Creation";
}

export function getCreationErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Could not load creations.");
}

function normalizeCreationFilters(filters: CreationFilters): GetCreationsParams {
  return {
    page: filters.page ?? 1,
    limit: filters.limit ?? 12,
    ...(filters.toolType && filters.toolType !== "all"
      ? {
          toolType: filters.toolType,
        }
      : {}),
    ...(filters.status && filters.status !== "all"
      ? {
          status: filters.status,
        }
      : {}),
    ...(filters.search?.trim()
      ? {
          search: filters.search.trim(),
        }
      : {}),
    ...(filters.includeFailed !== undefined
      ? {
          includeFailed: filters.includeFailed,
        }
      : {}),
  };
}