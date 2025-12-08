"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton() {
    return (
        <div className="bg-card rounded-lg overflow-hidden border border-border/20 shadow-sm">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function EventDetailSkeleton() {
    return (
        <div className="pb-24 md:pb-4">
            <Skeleton className="h-64 w-full" />
            <div className="px-4 max-w-4xl mx-auto space-y-6 pt-6">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                </div>
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="pb-24 md:pb-4">
            <div className="px-4 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 pt-8 pb-4">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <div className="flex-grow w-full space-y-2">
                        <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                        <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
                        <Skeleton className="h-4 w-full max-w-md mx-auto md:mx-0" />
                    </div>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-6 py-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-20" />
                    ))}
                </div>
                <Skeleton className="h-px w-full my-4" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}

export function CommentSkeleton() {
    return (
        <div className="flex gap-3 py-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2 pt-1">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                </div>
            </div>
        </div>
    );
}

export function MessageSkeleton() {
    return (
        <div className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-3 w-12" />
        </div>
    );
}
