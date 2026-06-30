/**
 * KeyValue
 * Compact label-value pair for simple metadata.
 *
 * Usage:
 * <KeyValue label="Region" value="Dhaka" />
 */
export interface KeyValueProps {
  label: string;
  value: string | number | null | undefined;
}

export const KeyValue = ({ label, value }: KeyValueProps) => {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-spice-text-muted">{label}</span>
      <span className="font-medium text-spice-text-primary">
        {value ?? '-'}
      </span>
    </div>
  );
};
