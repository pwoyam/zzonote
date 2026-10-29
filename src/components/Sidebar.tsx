import { FileText, Star, Tag, Trash2, Settings } from 'lucide-react';
import { useNotesStore } from '../store/notesStore';

interface Props {
  onOpenSettings: () => void;
}

export default function Sidebar({ onOpenSettings }: Props) {
  const { notes, activeTag, setActiveTag, view, setView } = useNotesStore();
  
  const allTags = Array.from(new Set(notes.filter(n => !n.isDeleted).flatMap(n => n.tags)));
  const activeNotesCount = notes.filter(n => !n.isDeleted).length;
  const pinnedCount = notes.filter(n => n.pinned && !n.isDeleted).length;
  const trashCount = notes.filter(n => n.isDeleted).length;

  return (
    <div className="w-60 h-screen bg-surface border-l border-border flex flex-col justify-between py-6 px-3 shrink-0 transition-colors duration-300">
      <div>
        <div className="flex items-center gap-3 mb-8 px-3">
          <div className="w-7 h-7 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">Z</div>
          <span className="font-bold text-[15px] text-content-primary tracking-tight">Zzonote</span>
        </div>

        <div className="space-y-1">
          {/* همه یادداشت‌ها */}
          <div 
            onClick={() => setView('all')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${view === 'all' && !activeTag ? 'bg-primary/10 text-primary' : 'text-content-muted hover:bg-bg-hover'}`}
          >
            <div className="flex items-center gap-3">
              <FileText size={17} />
              <span className="text-[13px] font-medium">همه یادداشت‌ها</span>
            </div>
            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{activeNotesCount}</span>
          </div>
          
          {/* علامت‌دارها */}
          <div 
            onClick={() => setView('pinned')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${view === 'pinned' ? 'bg-primary/10 text-primary' : 'text-content-muted hover:bg-bg-hover'}`}
          >
            <div className="flex items-center gap-3">
              <Star size={17} className={view === 'pinned' ? 'fill-primary' : ''} />
              <span className="text-[13px] font-medium">علامت‌دارها</span>
            </div>
            {pinnedCount > 0 && (
              <span className="text-[11px] bg-bg-hover text-content-muted px-2 py-0.5 rounded-full font-bold">{pinnedCount}</span>
            )}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-[11px] font-bold text-content-muted/70 px-3 mb-2 flex items-center gap-1.5"><Tag size={12}/> تگ‌ها</p>
          <div className="space-y-0.5">
            {allTags.length === 0 && <p className="text-[11px] text-content-muted px-3">تگی وجود ندارد</p>}
            {allTags.map((tag, i) => (
              <div 
                key={i} 
                onClick={() => setActiveTag(tag)}  // ← فقط setActiveTag، بدون setView
                className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer rounded-lg transition-colors ${activeTag === tag ? 'bg-primary/10 text-primary font-bold' : 'text-content-muted hover:text-content-primary hover:bg-bg-hover'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'][i % 4]}`} />
                <span className="text-[13px]">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1 border-t border-border/50 pt-4">
        <div 
          onClick={() => setView('trash')}
          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${view === 'trash' ? 'bg-red-500/10 text-red-500' : 'text-content-muted hover:bg-bg-hover'}`}
        >
          <div className="flex items-center gap-3">
            <Trash2 size={17} /> <span className="text-[13px] font-medium">زباله‌دان</span>
          </div>
          {trashCount > 0 && <span className="text-[11px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">{trashCount}</span>}
        </div>
        
        <div onClick={onOpenSettings} className="flex items-center gap-3 px-3 py-2 text-content-muted hover:bg-bg-hover rounded-lg cursor-pointer mt-1 transition-colors">
          <Settings size={17} /> <span className="text-[13px] font-medium">تنظیمات</span>
        </div>
      </div>
    </div>
  );
}
