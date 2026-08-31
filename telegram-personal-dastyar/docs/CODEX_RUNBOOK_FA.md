# راهنمای Codex: بازسازی و توسعهٔ ربات

این راهنما برای بازسازی مستقل ربات از ریپازیتوری خصوصی و ادامهٔ توسعه با Codex است.

## محدودهٔ پروژه

کد ربات در `telegram-personal-dastyar/` قرار دارد. ریشهٔ ریپازیتوری می‌تواند میزبان پروژه‌های مستقل دیگر برند بهرام باشد؛ وابستگی‌ها و تنظیمات این ربات را با پروژه‌های دیگر مخلوط نکنید.

## دستور شروع برای Codex

این متن را به Codex بدهید:

```text
در پوشهٔ telegram-personal-dastyar کار کن. ابتدا README.md و docs/SECURITY_FA.md را کامل بخوان.
هرگز Secret یا توکن را نخوان، چاپ نکن یا commit نکن. پیش از هر تغییر git status را بررسی کن.
پس از تغییر، pnpm lint && pnpm typecheck && pnpm test && pnpm build و git diff --check را اجرا کن.
فقط فایل‌های مربوط به درخواست را commit کن و بدون force-push به main push کن.
```

## راه‌اندازی محلی

```bash
cd telegram-personal-dastyar
pnpm install
cp .dev.vars.example .dev.vars
pnpm lint && pnpm typecheck && pnpm test
pnpm dev
```

`.dev.vars` محلی است و نباید commit شود. برای تست واقعی، از Secretهای موقت و حساب/کانال آزمایشی استفاده کنید.

## معماری مختصر

- `src/index.ts`: ورودی webhook و endpoint محافظت‌شدهٔ `/setup`
- `src/bot/handler.ts`: دستورات، پیش‌نمایش، تأیید و انتشار
- `src/domain/formatter.ts`: پاک‌سازی متن، ایموجی‌ها و HTML ساختاریافتهٔ Native Rich Message
- `src/storage/store.ts`: idempotency، پیش‌نویس‌ها، تنظیمات و مالک bootstrap در D1
- `src/telegram/client.ts`: فراخوانی Telegram Bot API
- `migrations/`: طرح D1

## قواعد تغییر

- امضا فقط یک‌بار و به‌صورت جدول `bordered` در Rich Message تولید شود.
- متن، رسانه و کارت باید با `sendRichMessage` در یک پیام منتشر شوند؛ برای انتشار محتوا به `sendMessage` یا caption قدیمی برنگردید.
- `file_id` تلگرام را حفظ کنید؛ فایل را بی‌دلیل دانلود یا ذخیره نکنید.
- انتشار باید تأیید صریح داشته باشد و وضعیت `READY_FOR_REVIEW → PUBLISHING` را اتمیک نگه دارد.
- برای قابلیت جدید، حداقل یک تست Vitest اضافه یا به‌روزرسانی کنید.
- تغییرات زیرساختی Cloudflare را طبق [راهنمای Cloudflare](CLOUDFLARE_RUNBOOK_FA.md) انجام دهید.
