

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * ذخیره‌سازی تصویر:
 * - در Tauri: ذخیره در پوشه AppData و برگرداندن مسیر asset
 * - در مرورگر: برگرداندن Base64 (برای پیش‌نمایش)
 */
export async function storeImage(file: File): Promise<string> {
  if (isTauri()) {
    try {
      const { writeFile, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `zzonote-img-${Date.now()}.${ext}`;
      
      await mkdir('images', { baseDir: BaseDirectory.AppData, recursive: true });
      
      const bytes = new Uint8Array(await file.arrayBuffer());
      await writeFile(`images/${fileName}`, bytes, { baseDir: BaseDirectory.AppData });
      
      return `asset://localhost/$APPDATA/images/${fileName}`;
    } catch (e) {
      console.error('Tauri image save failed, falling back to base64', e);
    }
  }
  return fileToBase64(file);
}
