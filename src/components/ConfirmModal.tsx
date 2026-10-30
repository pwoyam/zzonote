import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useT, useDir } from '../i18n/useT';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = false,
  onConfirm,
  onCancel
}: Props) {
  const t = useT();
  const dir = useDir();
  const confirmLabel = confirmText ?? t("common.confirm");
  const cancelLabel = cancelText ?? t("common.cancel");
  // بستن با دکمه Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* آیکون هشدار */}
        <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-content-primary/10 text-content-primary' : 'bg-bg-hover text-content-secondary'}`}>
          <AlertTriangle size={28} className={isDanger ? 'stroke-[2.5px]' : ''} />
        </div>

        <h3 className="text-lg font-bold text-content-primary mb-2">{title}</h3>
        <p className="text-sm text-content-muted mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-bg-hover text-content-secondary rounded-xl text-sm font-medium hover:bg-border transition-colors"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={() => { onConfirm(); onCancel(); }}
            className={`flex-1 px-4 py-2.5 text-bg-secondary rounded-xl text-sm font-medium transition-colors shadow-sm bg-content-primary hover:bg-content-secondary`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
