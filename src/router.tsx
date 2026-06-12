import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";
import { ApiError } from "./lib/api";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        if (typeof window === "undefined") return;
        const msg =
          error instanceof ApiError
            ? `${error.status ? `[${error.status}] ` : ""}${error.message}`
            : error?.message || "Request failed";
        toast.error(msg);
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
