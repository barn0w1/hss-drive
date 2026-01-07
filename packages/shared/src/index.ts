export const SHARED_MESSAGE = "Hello from shared!";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
