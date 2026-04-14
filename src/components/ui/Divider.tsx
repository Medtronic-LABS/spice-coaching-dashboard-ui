/**
 * Divider
 * Lightweight horizontal separator between content sections.
 *
 * Usage:
 * <Divider />
 */
export interface DividerProps {
  /** Optional class overrides for spacing/visibility tweaks. */
  className?: string;
}

export const Divider = ({ className }: DividerProps) => {
  return <hr className={`border-slate-200 ${className ?? ''}`.trim()} />;
};
