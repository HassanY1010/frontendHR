# README.md
# 🧠 AI-Powered HR Decision Platform

منصة قرارات موارد بشرية ذكية تعتمد على الذكاء الاصطناعي لاكتشاف المشكلات قبل تحولها إلى استقالات.

## 🎯 المميزات

### للموظفين
- تجربة PWA خفيفة وسريعة
- برنامج 30×3 اليومي (سؤال واحد يوميًا)
- مهام وتدريب ذكي
- إشعارات داعمة نفسيًا

### للمديرين
- لوحة تحكم ذكية مع تحذيرات استباقية
- نظام توظيف ذكي مع فرز بالسير الذاتية
- تحليل ضغط الفريق وأداء الموظفين
- توصيات مبنية على الذكاء الاصطناعي

### للمشرفين
- إدارة الشركات والاشتراكات
- مراقبة استخدام الذكاء الاصطناعي
- سجلات التدقيق والأمان

## 🛠️ التقنيات

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **State Management:** Zustand
- **Routing:** React Router v6
- **API:** TanStack Query
- **PWA:** vite-plugin-pwa

## 🚀 البدء السريع

```bash
# تثبيت الاعتماديات
pnpm install

# تشغيل جميع التطبيقات
pnpm dev

# أو تشغيل تطبيق محدد
pnpm dev:employee
pnpm dev:manager
pnpm dev:admin
pnpm dev:owner

# بناء الانتاج
pnpm build