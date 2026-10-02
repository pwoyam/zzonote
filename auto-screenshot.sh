#!/bin/bash
set -e

# ============ پیکربندی ============
PROJECT="$HOME/Projects/zzonote"
SCREENSHOTS_DIR="$PROJECT/screenshots"
STORE_DIR="$HOME/.local/share/com.zzonote.app"
STORE_FILE="$STORE_DIR/zzonote-data.json"
APPIMAGE="$PROJECT/src-tauri/target/release/bundle/appimage/Zzonote_0.1.0_amd64.AppImage"

mkdir -p "$SCREENSHOTS_DIR"
mkdir -p "$STORE_DIR"

# ============ ۱. بکاپ از داده‌های فعلی ============
if [ -f "$STORE_FILE" ]; then
    cp "$STORE_FILE" "$STORE_FILE.backup-$(date +%s)"
    echo "✅ بکاپ از داده‌های قبلی گرفته شد"
fi

# ============ ۲. ساخت نوت‌های نمونه ============
cat > "$STORE_FILE" << 'JSON_EOF'
{
  "notes": [
    {
      "id": "sample-note-1",
      "title": "به Zzonote خوش اومدی 🎉",
      "content": "# سلام! 👋\n\n**Zzonote** یه اپ یادداشت‌برداری سبک و سریعه که با **Tauri** و **React** ساخته شده.\n\n## چیزهایی که می‌تونی بکنی:\n\n- نوشتن با **Markdown**\n- پیش‌نمایش زنده کنار ادیتور\n- سازماندهی با تگ و رنگ\n- جستجوی سریع\n- **ذخیره‌سازی محلی** و امن\n\n> همه‌چیز روی سیستم خودت ذخیره می‌شه، بدون سرور.\n\nموفق باشی! ✨",
      "createdAt": 1727880000000,
      "updatedAt": 1727880000000,
      "pinned": true,
      "tags": ["شروع", "راهنما"],
      "color": "purple"
    },
    {
      "id": "sample-note-2",
      "title": "لیست کارهای امروز",
      "content": "## کارهای امروز 📋\n\n- [x] ساخت پروژه Zzonote\n- [x] انتشار نسخه اول روی GitHub\n- [ ] اضافه کردن قابلیت رمزنگاری\n- [ ] نوشتن تست‌ها\n- [ ] طراحی مجدد رابط کاربری\n\n### یادآوری\n\n> ساعت ۵ جلسه داریم — فراموش نکن! ⏰",
      "createdAt": 1727870000000,
      "updatedAt": 1727870000000,
      "pinned": false,
      "tags": ["کارها", "مهم"],
      "color": "orange"
    },
    {
      "id": "sample-note-3",
      "title": "ایده‌های خلاقانه 💡",
      "content": "## ایده‌های جدید برای Zzonote\n\n### قابلیت‌های آینده\n\n1. **رمزنگاری نوت‌های حساس**\n2. **Sync بین دستگاه‌ها** با WebDAV\n3. **حالت تمرکز** (Zen Mode)\n4. **ورود از Markdown**\n5. **یادآور و Todo**\n\n### نمونه کد\n\n```js\nconst future = {\n  encryption: true,\n  sync: \"webdav\",\n  zenMode: true,\n};\n```\n\n**هر ایده‌ای که رسید، همین‌جا بنویس!** ✍️",
      "createdAt": 1727860000000,
      "updatedAt": 1727860000000,
      "pinned": false,
      "tags": ["ایده", "خلاقیت"],
      "color": "blue"
    },
    {
      "id": "sample-note-4",
      "title": "دستورات مفید",
      "content": "## دستورات پرکاربرد لینوکس\n\n```bash\n# مشاهده فضای دیسک\ndf -h\n\n# پیدا کردن فایل‌های بزرگ\ndu -ah . | sort -rh | head -20\n\n# تغییر مالکیت فایل‌ها\nsudo chown -R $USER:$USER .\n```\n\n### میان‌برهای Zzonote\n\n| کلید | کار |\n|------|-----|\n| `Ctrl+N` | نوت جدید |\n| `Ctrl+F` | جستجو |\n| `Ctrl+B` | تا کردن سایدبار |",
      "createdAt": 1727850000000,
      "updatedAt": 1727850000000,
      "pinned": false,
      "tags": ["فنی"],
      "color": "green"
    },
    {
      "id": "sample-note-5",
      "title": "یادداشت جلسه",
      "content": "## جلسه با تیم — ۱۴۰۳/۰۷/۱۰\n\n### حاضرین\n- علی\n- سارا\n- رضا\n\n### مصوبات\n\n1. **نسخه ۰.۲** تا پایان ماه\n2. اضافه شدن **حالت تاریک** به تنظیمات\n3. **رفع باگ** اسکرول در لیست نوت‌ها\n\n### اکشن‌آیتم‌ها\n\n- [ ] علی: طراحی صفحه‌ی تنظیمات\n- [ ] سارا: نوشتن تست\n- [ ] رضا: دیپلوی روی سرور",
      "createdAt": 1727840000000,
      "updatedAt": 1727840000000,
      "pinned": false,
      "tags": ["جلسه"],
      "color": "pink"
    }
  ],
  "tags": [
    { "id": "tag-start", "name": "شروع", "color": "#8b5cf6" },
    { "id": "tag-guide", "name": "راهنما", "color": "#6366f1" },
    { "id": "tag-todo", "name": "کارها", "color": "#f59e0b" },
    { "id": "tag-important", "name": "مهم", "color": "#ef4444" },
    { "id": "tag-idea", "name": "ایده", "color": "#3b82f6" },
    { "id": "tag-creative", "name": "خلاقیت", "color": "#8b5cf6" },
    { "id": "tag-tech", "name": "فنی", "color": "#10b981" },
    { "id": "tag-meeting", "name": "جلسه", "color": "#ec4899" }
  ]
}
JSON_EOF

echo "✅ ۵ نوت نمونه ساخته شد"
echo "📁 محل: $STORE_FILE"

# ============ ۳. اجرای اپ ============
if [ ! -f "$APPIMAGE" ]; then
    echo "❌ AppImage پیدا نشد: $APPIMAGE"
    exit 1
fi

chmod +x "$APPIMAGE"

echo ""
echo "🚀 اجرای Zzonote..."
"$APPIMAGE" >/dev/null 2>&1 &
APP_PID=$!
echo "PID: $APP_PID"

# ============ ۴. صبر برای لود کامل ============
echo ""
echo "⏳ صبر ۸ ثانیه تا اپ کامل باز بشه..."
sleep 8

# ============ ۵. اسکرین‌شات ============
echo ""
echo "📸 گرفتن اسکرین‌شات‌ها..."

# راه ۱: اسکرین‌شات کل صفحه
gnome-screenshot -f "$SCREENSHOTS_DIR/preview.png" 2>/dev/null || \
    scrot "$SCREENSHOTS_DIR/preview.png" 2>/dev/null || \
    import -window root "$SCREENSHOTS_DIR/preview.png" 2>/dev/null

if [ -f "$SCREENSHOTS_DIR/preview.png" ]; then
    echo "  ✅ preview.png ($(du -h "$SCREENSHOTS_DIR/preview.png" | cut -f1))"
fi

# اسکرین‌شات پنجره‌ی فعال (اختیاری)
sleep 1
gnome-screenshot -w -f "$SCREENSHOTS_DIR/window.png" 2>/dev/null || \
    scrot -u "$SCREENSHOTS_DIR/window.png" 2>/dev/null || true

if [ -f "$SCREENSHOTS_DIR/window.png" ]; then
    echo "  ✅ window.png"
fi

# ============ ۶. بستن اپ ============
echo ""
echo "🔒 بستن اپ..."
kill "$APP_PID" 2>/dev/null || true
sleep 1

echo ""
echo "════════════════════════════════════════"
echo "✅ تمام!"
echo "📁 اسکرین‌شات‌ها در: $SCREENSHOTS_DIR"
ls -la "$SCREENSHOTS_DIR/"
echo "════════════════════════════════════════"
