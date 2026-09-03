"use client"
import * as React from "react"

const ThemeContext = React.createContext({
  theme: "light",
  setTheme: () => {},
})

export function useTheme() {
  return React.useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = React.useState("light")

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = localStorage.getItem("fishviet-theme") || localStorage.getItem("fisherblog-theme")
      const initial = stored || "light"
      setTheme(initial)
      document.documentElement.classList.toggle("dark", initial === "dark")
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const handleSetTheme = React.useCallback((newTheme) => {
    setTheme(newTheme)
    localStorage.setItem("fishviet-theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
