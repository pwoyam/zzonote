import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check } from "lucide-react";
import { useDir } from "../../i18n/useT";

interface Props {
  open: boolean;
  src: string;
  onClose: () => void;
  onApply: (newSrc: string) => void;
}

function centerAspectCrop(w: number, h: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, w / h, w, h),
    w,
    h
  );
}

export default function CropModal({ open, src, onClose, onApply }: Props) {
  const dir = useDir();
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  const applyCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const newSrc = canvas.toDataURL("image/jpeg", 0.92);
    onApply(newSrc);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      dir={dir}
    >
      <div
        className="w-full max-w-3xl mx-4 bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <h3 className="text-[15px] font-semibold text-content-primary">Crop image</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/20">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            className="max-h-[60vh]"
          >
            <img
              ref={imgRef}
              src={src}
              onLoad={onImageLoad}
              alt="crop"
              style={{ maxHeight: "60vh", maxWidth: "100%" }}
            />
          </ReactCrop>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12.5px] font-medium bg-bg-hover text-content-secondary hover:bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={applyCrop}
            disabled={!completedCrop}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-medium bg-content-primary text-bg-secondary hover:bg-content-secondary transition-colors disabled:opacity-40"
          >
            <Check size={14} />
            Apply crop
          </button>
        </div>
      </div>
    </div>
  );
}
