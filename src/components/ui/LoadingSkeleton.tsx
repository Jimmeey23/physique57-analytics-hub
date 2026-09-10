import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  type: 'metric-cards' | 'table' | 'chart' | 'full-page';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type, count = 4 }) => {
  switch (type) {
    case 'metric-cards':
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-3.5 w-24" />
              </CardHeader>
              <CardContent className="space-y-2.5">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case 'table':
      return (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-3">
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      );

    case 'chart':
      return (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Skeleton className="h-60 w-full" />
              <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-2">
                {[38, 62, 45, 78, 55, 88, 66, 48].map((h, i) => (
                  <div
                    key={i}
                    className="p57-skeleton w-full rounded-t-md"
                    style={{ height: `${h * 1.8}px` }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'full-page':
      return (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-[18px]" />
          <LoadingSkeleton type="metric-cards" count={4} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LoadingSkeleton type="chart" />
            <LoadingSkeleton type="chart" />
          </div>
          <LoadingSkeleton type="table" />
        </div>
      );

    default:
      return <Skeleton className="h-32 w-full" />;
  }
};
