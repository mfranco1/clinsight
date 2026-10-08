import { BRAND } from "../../config/brand";

export default function BrandName({ className = "" }: { className?: string }) {
  return <span className={className}>{BRAND.name}</span>;
}
