"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Theme toggle styled as a Base UI Menu.Item — used inside the mobile
 * hamburger dropdown. Stays open after click? No — Menu.Item closes the
 * menu by default, which is fine for a one-shot toggle.
 */
export function ThemeToggleItem() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <MenuPrimitive.Item
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-sm text-foreground outline-none transition-colors hover:bg-accent/40 data-[highlighted]:bg-accent/40"
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4 text-muted-foreground" />
        ) : (
          <Moon className="size-4 text-muted-foreground" />
        )
      ) : (
        <span className="size-4" aria-hidden />
      )}
      {isDark ? "切換淺色模式" : "切換深色模式"}
    </MenuPrimitive.Item>
  );
}
