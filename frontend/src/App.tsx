import { Toaster } from 'sonner';
import MemeStudio from './components/MemeStudio';
import { ThemeContext, useThemeState } from './hooks/useTheme';

function App() {
  const themeState = useThemeState();

  return (
    <ThemeContext.Provider value={themeState}>
      <MemeStudio />
      <Toaster 
        position="top-right" 
        theme={themeState.theme}
        richColors
        closeButton
      />
    </ThemeContext.Provider>
  );
}

export default App;