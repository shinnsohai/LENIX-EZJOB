import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    /** Show a non-blocking notification. Replaces every `alert(...)` call in the app. */
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION_MS = 4000;

const TOAST_STYLES: Record<ToastType, { icon: React.ElementType; classes: string; iconClasses: string; role: 'status' | 'alert' }> = {
    success: {
        icon: CheckCircle2,
        classes: 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100',
        iconClasses: 'text-emerald-500 dark:text-emerald-400',
        role: 'status',
    },
    error: {
        icon: XCircle,
        classes: 'bg-red-50 dark:bg-red-950/90 border-red-500 dark:border-red-600 text-red-900 dark:text-red-100',
        iconClasses: 'text-red-500 dark:text-red-400',
        role: 'alert',
    },
    info: {
        icon: Info,
        classes: 'bg-cyan-50 dark:bg-cyan-950/90 border-cyan-500 dark:border-cyan-600 text-cyan-900 dark:text-cyan-100',
        iconClasses: 'text-cyan-500 dark:text-cyan-400',
        role: 'status',
    },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = nextId.current++;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    }, [dismissToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Fixed above the sticky header (z-50) so a toast is never hidden behind it. */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[calc(100%-2rem)] max-w-md pointer-events-none">
                {toasts.map((toast) => {
                    const style = TOAST_STYLES[toast.type];
                    const Icon = style.icon;
                    return (
                        <div
                            key={toast.id}
                            role={style.role}
                            aria-live={style.role === 'alert' ? 'assertive' : 'polite'}
                            className={`pointer-events-auto animate-fade-in-up px-5 py-4 rounded-2xl shadow-lg border-l-4 flex items-start gap-3 ${style.classes}`}
                        >
                            <Icon size={22} className={`flex-shrink-0 mt-0.5 ${style.iconClasses}`} aria-hidden="true" />
                            <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
                            <button
                                onClick={() => dismissToast(toast.id)}
                                aria-label="Dismiss notification"
                                className="flex-shrink-0 p-1 rounded-full text-current opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
