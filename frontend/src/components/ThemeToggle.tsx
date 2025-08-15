import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 
        bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 
        transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
        ${className}
      `}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
      title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <Moon size={20} className="text-neutral-600" />
      ) : (
        <Sun size={20} className="text-yellow-500" />
      )}
    </button>
  );
}