import type { PropsWithChildren } from "react";

export function LoadingState({ children }: PropsWithChildren) {
  return <div className="feedback-card">{children ?? "Loading..."}</div>;
}

export function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="feedback-card feedback-error">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="feedback-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
