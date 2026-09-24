import { VikaEmblem } from '@/components/VikaBrand';

type BrandMarkProps = {
  size?: number;
  /** Kept for backwards compatibility; the emblem scales with `size`. */
  iconSize?: number;
};

/** Compact Vika Hotel emblem used in headers and small brand spots. */
export function BrandMark({ size = 40 }: BrandMarkProps) {
  return <VikaEmblem size={size} elevated={false} />;
}
