# Bahram Brand Assistant

ربات خصوصی تلگرامِ بهرام قربانی، روی Cloudflare Workers و D1. پیام متنی یا پست فورواردی را به پیش‌نویس قابل‌تأیید تبدیل می‌کند، ارجاعات کانال مبدأ را پاک می‌کند، ایموجی‌های فناوری/آتش/راکت به ابتدای پاراگراف‌ها می‌افزاید و امضا را در قالب نقل‌قول قرار می‌دهد.

امضای پیش‌فرض شامل لینک کانال [@bahrameghorbani](https://t.me/bahrameghorbani) و اسپانسر «پی‌کار» با لینک [@paykaarcom](https://t.me/paykaarcom) است. هر دو از منوی `/settings` قابل تغییرند و در D1 ذخیره می‌شوند.

## قابلیت‌ها

- متن، عکس، ویدئو، فایل صوتی، فایل و آلبوم‌های فورواردی
- نگهداری `file_id` تلگرام؛ فایل‌ها روی سرور جداگانه ذخیره نمی‌شوند
- پیش‌نمایش خصوصی و تأیید صریح پیش از انتشار
- تنظیم مستقل متن/لینک امضا، متن/لینک اسپانسر و فهرست ایموجی‌ها
- جلوگیری از پردازش تکراری webhook با D1
- پاک‌سازی محافظه‌کارانهٔ footer و ارجاعات کانال مبدأ در پست فورواردی

## استقرار

پیش‌نیاز: Node.js 22+، pnpm، حساب Cloudflare و دسترسی مدیر برای ربات در کانال مقصد.

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm lint && pnpm typecheck && pnpm test
```

1. در Cloudflare وارد شوید: `pnpm exec wrangler login`
2. دیتابیس بسازید: `pnpm exec wrangler d1 create bahram-brand-assistant`
3. شناسهٔ برگردانده‌شده را جای `REPLACE_WITH_D1_DATABASE_ID` در `wrangler.jsonc` قرار دهید.
4. مهاجرت را اعمال کنید: `pnpm exec wrangler d1 migrations apply bahram-brand-assistant --remote`
5. مقادیر واقعی `.dev.vars` را به‌صورت secret وارد کنید: `pnpm exec wrangler secret put TELEGRAM_BOT_TOKEN` و برای `TELEGRAM_WEBHOOK_SECRET`.
6. متغیرهای غیرمحرمانهٔ `.dev.vars.example` را در Cloudflare Worker وارد کنید، سپس `pnpm run deploy` را اجرا کنید.
7. webhook را با secret token روی نشانی Worker تنظیم کنید:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<worker>.workers.dev" \
  -d "secret_token=<WEBHOOK_SECRET>" \
  -d 'allowed_updates=["message","callback_query"]'
```

برای آلبوم‌ها، تلگرام پایان گروه را به ربات اعلام نمی‌کند؛ پس از رسیدن همهٔ فایل‌ها `/review` را بزنید. هیچ فایل یا توکنی در گیت ثبت نمی‌شود.

برای راه‌اندازی بدون واردکردن Telegram ID، مقدار `AUTHORIZED_USER_IDS=bootstrap` و یک `BOOTSTRAP_CODE` محرمانه تنظیم کنید. سپس فقط مالک با پیوند `https://t.me/<bot>?start=<BOOTSTRAP_CODE>` می‌تواند یک‌بار خود را ثبت کند؛ ربات از آن پس خصوصی می‌ماند.
