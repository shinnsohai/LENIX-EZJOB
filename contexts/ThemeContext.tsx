import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Retrieve stored theme or default to 'dark' for LENIX high-tech aesthetic
        const storedTheme = localStorage.getItem('lenix_theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }
        return 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
            document.body.style.backgroundColor = '#020617';
            document.body.style.color = '#f8fafc';
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
            document.body.style.backgroundColor = '#ffffff';
            document.body.style.color = '#0f172a';
        }
        localStorage.setItem('lenix_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
