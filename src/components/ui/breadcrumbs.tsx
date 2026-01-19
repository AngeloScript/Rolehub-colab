import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-2 text-sm text-muted-foreground mb-4", className)}>
            <Link href="/" className="hover:text-foreground transition-colors flex items-center">
                <Home className="w-4 h-4" />
                <span className="sr-only">Home</span>
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <ChevronRight className="w-4 h-4" />
                    {item.href && !item.active ? (
                        <Link href={item.href} className="hover:text-foreground transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className={cn("font-medium", item.active && "text-foreground")}>
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
