// Utilities
export { cn } from './utils/cn';

// Shadcn primitives — vendored, hand-written equivalents of @shadcn/ui registry components
export { Button, buttonVariants, type ButtonProps } from './components/ui/button';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './components/ui/card';
export { Input } from './components/ui/input';
export { Badge, badgeVariants, type BadgeProps } from './components/ui/badge';
export { Skeleton } from './components/ui/skeleton';
export { Separator } from './components/ui/separator';

// LocalChamp shared components
export {
  BusinessCard,
  type BusinessCardBusiness,
  type BusinessCardProps,
} from './components/business-card';
export {
  BreadcrumbTrail,
  type BreadcrumbItem,
  type BreadcrumbTrailProps,
} from './components/breadcrumb-trail';
export {
  ScoreBadge,
  type ScoreBadgeVariant,
  type ScoreBadgeProps,
} from './components/score-badge';
export {
  DirectoryHero,
  type DirectoryHeroProps,
} from './components/directory-hero';
export { CityCard, type CityCardCity, type CityCardProps } from './components/city-card';
