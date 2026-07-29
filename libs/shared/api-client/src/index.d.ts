export const userKeys: {
  all: readonly string[];
  me: () => readonly string[];
  details: () => readonly string[];
  detail: (id: string) => readonly string[];
};

export function fetchMe(): Promise<any>;
export function apiClient(path: string, options?: RequestInit): Promise<any>;
