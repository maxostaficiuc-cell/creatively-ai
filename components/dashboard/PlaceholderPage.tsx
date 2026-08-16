import { EmptyState } from "@/components/ui/EmptyState";
import { Construction } from "lucide-react";

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <EmptyState
        icon={<Construction size={20} />}
        title={title}
        description={description}
      />
    </div>
  );
}
