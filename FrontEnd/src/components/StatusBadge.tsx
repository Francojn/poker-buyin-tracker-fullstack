export default function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-${value.toLowerCase().replace(/_/g, "-")}`}>{value}</span>;
}
