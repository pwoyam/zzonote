import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

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
  confirmText = "تایید",
  cancelText = "انصراف",
  isDanger = false,
  onConfirm,
  onCancel
}: Props) {
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
        dir="rtl"
      >
        {/* آیکون هشدار */}
        <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
          <AlertTriangle size={28} className={isDanger ? 'stroke-[2.5px]' : ''} />
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onCancel(); }}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium transition-colors shadow-sm ${isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
