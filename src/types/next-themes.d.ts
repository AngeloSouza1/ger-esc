// src/types/next-themes.d.ts
declare module "next-themes" {
  import { ReactNode } from "react";

  export interface ThemeProviderProps {
    children: ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;

  export function useTheme(): {
    theme?: string;
    setTheme: (theme: string) => void;
    systemTheme?: "light" | "dark";
  };
}
