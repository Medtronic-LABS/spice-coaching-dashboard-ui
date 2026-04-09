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
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value ?? '-'}</dd>
    </div>
  );
};
