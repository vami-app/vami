import { Link } from "@/components/atoms/link";
import { Icon } from "@/components/atoms/icon";
import { Text } from "@/components/atoms/text";

export function StatCard({ name, stat, icon, href }) {
  return (
    <Link variant="default" href={href} className="hover:no-underline">
      <div className="relative bg-surface p-6 sm:p-8 border border-border-subtle rounded-[calc(var(--outer-radius)-8px)] overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex items-start justify-between">
        <div>
          <Text variant="caption" className="font-medium uppercase tracking-wide">
            {name}
          </Text>
          <Text as="p" variant="headline" className="mt-4 text-4xl sm:text-5xl font-light tracking-tight">
            {stat}
          </Text>
        </div>
        <div className="bg-surface-muted rounded-2xl p-4 border border-border-subtle group-hover:bg-text-primary group-hover:border-text-primary transition-colors duration-300 flex items-center justify-center">
          <Icon icon={icon} size="md" className="text-text-muted group-hover:text-text-inverse transition-colors duration-300" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
