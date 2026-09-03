"use client"
import * as React from "react"
import { Moon, Sun } from "@phosphor-icons/react"
import { useTheme } from "@/components/ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button type="button" className="kinetic relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-foreground/[0.05] active:scale-95" onClick={() => setTheme(theme === "light" ? "dark" : "light")}> 
      <Sun size={18} weight="light" className="kinetic rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon size={18} weight="light" className="kinetic absolute rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Chuyển giao diện sáng tối</span>
    </button>
  )
}
