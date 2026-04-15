import axios from "axios";
import type { ApiErrorResponse } from "../types/api";

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data as unknown;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    const obj = data as ApiErrorResponse | undefined;
    return (
      obj?.message ||
      obj?.error ||
      obj?.details ||
      error.message
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
