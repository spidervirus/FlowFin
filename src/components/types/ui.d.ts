declare module "@/components/ui/*" {
  import { ComponentType, HTMLAttributes } from "react";

  export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "destructive";
  }

  export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline";
  }

  export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
  }

  export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

  export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

  export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

  export interface CardDescriptionProps
    extends HTMLAttributes<HTMLParagraphElement> {}

  export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

  export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

  export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
    value?: number;
  }

  export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

  export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
  }

  export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

  export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
    value: string;
  }

  export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
    value: string;
  }

  export const Alert: ComponentType<AlertProps>;
  export const AlertTitle: ComponentType<HTMLAttributes<HTMLHeadingElement>>;
  export const AlertDescription: ComponentType<
    HTMLAttributes<HTMLParagraphElement>
  >;
  export const Badge: ComponentType<BadgeProps>;
  export const Button: ComponentType<ButtonProps>;
  export const Card: ComponentType<CardProps>;
  export const CardHeader: ComponentType<CardHeaderProps>;
  export const CardContent: ComponentType<CardContentProps>;
  export const CardDescription: ComponentType<CardDescriptionProps>;
  export const CardFooter: ComponentType<CardFooterProps>;
  export const CardTitle: ComponentType<CardTitleProps>;
  export const Progress: ComponentType<ProgressProps>;
  export const Skeleton: ComponentType<SkeletonProps>;
  export const Tabs: ComponentType<TabsProps>;
  export const TabsList: ComponentType<TabsListProps>;
  export const TabsTrigger: ComponentType<TabsTriggerProps>;
  export const TabsContent: ComponentType<TabsContentProps>;
}
