export type Paginated<T> = {
  data: T[];
  total: number;
};

export type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};
