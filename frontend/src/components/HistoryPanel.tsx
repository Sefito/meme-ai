import { useState } from 'react';
import { History, Trash2, X } from 'lucide-react';
import { HistoryItem } from '../types';
import { toast } from 'sonner';

interface HistoryPanelProps {
  history: HistoryItem[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  onSelect: (item: HistoryItem) => void;
  className?: string;
}

export default function HistoryPanel({
  history,
  isOpen,
  onToggle,
  onClear,
  onSelect,
  className = ''
}: HistoryPanelProps) {

  const handleClear = () => {
    if (history.length > 0) {
      onClear();
      toast.success('Historial limpiado');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 p-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-full shadow-lg hover:shadow-xl transition-all"
        aria-label="Toggle history panel"
      >
        <History size={20} />
        {history.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {Math.min(history.length, 9)}
          </span>
        )}
      </button>

      {/* Panel Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={onToggle}
        />
      )}

      {/* History Panel */}
      <div
        className={`
          fixed left-0 top-0 h-full w-80 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 shadow-xl z-50 transform transition-transform duration-300 overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History size={20} />
            Historial
            {history.length > 0 && (
              <span className="bg-neutral-200 dark:bg-neutral-700 text-xs px-2 py-1 rounded-full">
                {history.length}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="p-1 text-neutral-500 hover:text-red-500 transition-colors"
                title="Limpiar historial"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              aria-label="Cerrar panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto pb-16">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-500 dark:text-neutral-400">
              <History size={48} className="mb-4 opacity-50" />
              <p className="text-center">
                Aún no tienes imágenes<br />en tu historial
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-3">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="relative group cursor-pointer bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  <img
                    src={item.imageUrl}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs truncate font-medium">
                        {item.prompt}
                      </p>
                      <p className="text-white/80 text-xs">
                        {formatDate(item.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}