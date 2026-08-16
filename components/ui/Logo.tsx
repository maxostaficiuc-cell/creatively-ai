import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      <Image src="/logo-icon.png" alt="" width={28} height={28} className="rounded-md" />
      <span className="text-lg font-semibold tracking-tight text-ink-primary">
        creatively<span className="text-brand-light">.ai</span>
      </span>
    </Link>
  );
}
