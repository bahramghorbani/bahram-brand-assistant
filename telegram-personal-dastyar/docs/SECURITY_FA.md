# امنیت و Secretها

## اصل اصلی

هیچ توکن، رمز، bootstrap code یا مقدار واقعی محیطی نباید در GitHub، commit، Issue، Pull Request یا گفت‌وگو ذخیره شود. فایل `.dev.vars.example` فقط نمونه و placeholder دارد؛ `.dev.vars` و `node_modules` با `.gitignore` کنار گذاشته شده‌اند.

## Secretهای Cloudflare

این مقادیر فقط باید در Cloudflare Worker به‌صورت **Secret** ثبت شوند:

| نام | کاربرد |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | توکن BotFather برای `@dastyarbahramBot` |
| `TELEGRAM_WEBHOOK_SECRET` | اعتبارسنجی درخواست‌های webhook تلگرام |
| `BOOTSTRAP_CODE` | فعال‌سازی یک‌بارهٔ مالک ربات |

متغیرهای عمومی مانند نام کانال، متن امضا، اسپانسر و فهرست ایموجی‌ها در `wrangler.jsonc` قرار دارند و Secret نیستند.

## کنترل پیش از commit

از ریشهٔ زیرپروژه اجرا کنید:

```bash
git ls-files | rg '(^|/)(\.dev\.vars|\.env|.*\.pem|.*\.key)$'
rg -n -i --hidden --glob '!node_modules/**' --glob '!.git/**' \
  '(gho_[A-Za-z0-9_]+|[0-9]{8,12}:[A-Za-z0-9_-]{25,}|TELEGRAM_BOT_TOKEN\s*=\s*[^r])' .
```

خروجی هر دو دستور باید خالی باشد. سپس `git diff --check` و مجموعهٔ تست‌ها را اجرا کنید.

## اگر Secret افشا شد

1. فوراً توکن BotFather را revoke و یک توکن جدید بسازید.
2. Secret جدید را فقط در Cloudflare ثبت کنید.
3. webhook را دوباره از endpoint محافظت‌شدهٔ `/setup` وصل کنید.
4. اگر مقدار وارد Git شده، آن را از تاریخچهٔ عمومی فرض کنید؛ صرف پاک‌کردن فایل در commit بعدی کافی نیست.
5. بدون قراردادن مقدار Secret در متن، رخداد و زمان چرخش توکن را ثبت کنید.
