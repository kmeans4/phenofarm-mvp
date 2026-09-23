interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-pf-raised rounded ${className}`} style={style} />
  );
}
