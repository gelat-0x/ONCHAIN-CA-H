interface SectionDividerProps {
  name: string;
}

export function SectionDivider({ name }: SectionDividerProps) {
  const line = '─'.repeat(14);
  return (
    <div className="section-divider">
      {line} {name} {line}
    </div>
  );
}
