# راهنمای Cloudflare: استقرار و بازیابی ربات

## پیش‌نیازها

- Node.js 22+ و pnpm
- دسترسی Cloudflare به حساب مقصد
- ربات `@dastyarbahramBot` و دسترسی ادمینِ ارسال پیام در `@bahrameghorbani`
- CLI Wrangler با ورود OAuth: `pnpm exec wrangler login`

## ساخت دوبارهٔ زیرساخت

از پوشهٔ `telegram-personal-dastyar/` اجرا کنید:

```bash
pnpm install
pnpm exec wrangler d1 create bahram-brand-assistant
```

شناسهٔ D1 خروجی را جای `database_id` در `wrangler.jsonc` بگذارید. اگر نام دیتابیس جدید است، `database_name` را نیز تغییر دهید. سپس:

```bash
pnpm exec wrangler d1 migrations apply bahram-brand-assistant --remote
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm run deploy
```

## متغیرهای عمومی

این‌ها در `wrangler.jsonc` نگهداری می‌شوند و با deploy منتشر می‌شوند:

- `DESTINATION_CHAT_ID=@bahrameghorbani`
- `DESTINATION_CHANNEL_USERNAME=bahrameghorbani`
- متن امضا، لینک‌ها، اسپانسر و ایموجی‌ها
- `AUTHORIZED_USER_IDS=bootstrap` برای ثبت امن مالک در نصب جدید

## ثبت Secretها

در Cloudflare Dashboard:

`Workers & Pages → bahram-brand-assistant → Settings → Variables and secrets → Add`

این سه مقدار را با نوع **Secret** وارد کنید:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
BOOTSTRAP_CODE
```

`TELEGRAM_WEBHOOK_SECRET` و `BOOTSTRAP_CODE` را با مقدار URL-safe تصادفیِ حداقل ۲۴ کاراکتری بسازید. آن‌ها را در کد یا GitHub ننویسید.

## اتصال webhook بدون افشای توکن

پس از ثبت Secretها و deploy، endpoint زیر را فقط از دستگاه قابل‌اعتماد اجرا کنید:

```bash
curl --fail-with-body -X POST 'https://<worker>.workers.dev/setup' \
  -H 'X-Setup-Code: <BOOTSTRAP_CODE>'
```

Worker با `TELEGRAM_BOT_TOKEN` داخلی، webhook تلگرام را تنظیم می‌کند؛ توکن در این دستور دیده یا منتقل نمی‌شود. پاسخ درست `Webhook configured` است.

## فعال‌سازی مالک

فقط مالک این پیوند را باز و Start را می‌زند:

```text
https://t.me/dastyarbahramBot?start=<BOOTSTRAP_CODE>
```

اولین حسابی که کد صحیح را بفرستد در D1 ثبت می‌شود. پس از آن، ربات خصوصی باقی می‌ماند. کد bootstrap را مثل رمز نگه دارید و در صورت نگرانی آن را rotate کنید.

## کنترل پس از استقرار

1. در گفت‌وگوی خصوصی ربات، `/start` یا لینک bootstrap را ارسال کنید.
2. یک متن کوتاه بفرستید و بررسی کنید ایموجی‌ها، عنوان انگلیسی و جدول bordered کارت Rich Message درست هستند.
3. دکمهٔ تأیید را بزنید و انتشار در `@bahrameghorbani` را کنترل کنید.
4. برای آلبوم، همهٔ فایل‌ها را بفرستید و سپس `/review` را بزنید.

اگر webhook پاسخ نداد، ابتدا Secretها و دسترسی ادمینِ ربات در کانال را بررسی کنید؛ سپس `/setup` را دوباره با bootstrap code اجرا کنید.
