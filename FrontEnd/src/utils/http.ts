import axios from "axios";
import type { ApiErrorResponse } from "../types/api";

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    return (
      data?.message ||
      data?.error ||
      data?.details ||
      error.message
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
