import type { ReactNode } from "react";

type ToolbarRowProps = {
  columns?: 2 | 3 | 4;
  children: ReactNode;
  action?: ReactNode;
  dir?: "rtl" | "ltr";
};

const colClassMap = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

export function ToolbarRow({
  columns = 3,
  children,
  action,
  dir = "rtl",
}: ToolbarRowProps) {
  const cols = colClassMap[columns] ?? colClassMap[3];
  return (
    <div dir={dir}>
      <div className={`grid ${cols} gap-4`}>{children}</div>
      {action ? <div className="mt-3 flex justify-end">{action}</div> : null}
    </div>
  );
}

export default ToolbarRow;
