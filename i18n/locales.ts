/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const fa = {
  header: {
    title: "خلاصه‌ساز اخبار با هوش مصنوعی",
    settings: "تنظیمات",
  },
  app: {
    loadingMessage: "در حال تحلیل آخرین اخبار... لطفاً صبر کنید.",
    authMessage: "در حال احراز هویت با Inoreader...",
    error: "خطا",
    summarizeError: "خطایی رخ داد: {error}",
    chatError: "خطایی در چت رخ داد: {error}",
    emptyFeedError: "فید خالی است یا قابل خواندن نیست.",
    allFeedsFetchError: "امکان دریافت هیچ یک از فیدهای خبری وجود نداشت. لطفاً اعتبارنامه‌های Inoreader و اتصال اینترنت خود را بررسی کنید.",
    authFailed: "احراز هویت ناموفق بود: {error}",
    inoreaderAuthFailed: "احراز هویت Inoreader ناموفق بود: {error}",
    inoreaderCredsError: "احراز هویت ناموفق بود: اعتبارنامه‌های موقت یافت نشد. لطفاً دوباره لینک احراز هویت را ایجاد کنید.",
    inoreaderCredsNeededTitle: "اتصال به Inoreader الزامی است",
    inoreaderCredsNeeded: "برای استفاده از این برنامه، لطفاً ابتدا اطلاعات کاربری Inoreader خود را در بخش تنظیمات وارد کنید.",
    refreshTokenMessage: "در حال تازه‌سازی اتصال به Inoreader...",
    sessionExpired: "جلسه شما منقضی شده است. لطفاً دوباره متصل شوید.",
    refreshTokenError: "امکان تازه‌سازی اتصال وجود نداشت: {error}. لطفاً دوباره متصل شوید.",
  },
  articleCard: {
    readMore: "ادامه مطلب",
  },
  settingsModal: {
    title: "تنظیمات Inoreader",
    instructionsTitle: "چگونه اطلاعات را دریافت کنیم؟",
    instructions: [
        'به بخش <a href="https://www.inoreader.com/preferences/developer" target="_blank" rel="noopener noreferrer" class="text-orange-400 hover:underline">Developers</a> در تنظیمات Inoreader بروید.',
        "یک اپلیکیشن جدید بسازید.",
        'در قسمت "Redirect URIs"، مقدار زیر را <strong>دقیقا</strong> وارد کنید:',
        "<strong>OAuth Client ID</strong> و <strong>OAuth Client secret</strong> را کپی کرده و در کادرهای زیر وارد کنید.",
    ],
    clientIdLabel: "OAuth Client ID",
    clientIdPlaceholder: "شناسه کلاینت OAuth خود را وارد کنید",
    clientSecretLabel: "OAuth Client Secret",
    clientSecretPlaceholder: "کلید مخفی کلاینت OAuth خود را وارد کنید",
    generateLinkButton: "ایجاد لینک احراز هویت",
    authLinkStep1: "۱. این لینک را کپی کرده، در یک تب جدید باز کنید و به برنامه اجازه دسترسی دهید.",
    authLinkLabel: "لینک احراز هویت",
    authLinkStep2: "۲. پس از تایید، به صفحه‌ای با خطا هدایت می‌شوید. این طبیعی است! آدرس کامل (URL) را از نوار آدرس مرورگر کپی و اینجا وارد کنید.",
    redirectUrlLabel: "آدرس URL بازگشتی",
    redirectUrlPlaceholder: "آدرس کامل را اینجا وارد کنید (مثال: http://localhost...)",
    completeButton: "تکمیل اتصال",
    connectedMessage: "✓ با موفقیت به Inoreader متصل شدید.",
    disconnectButton: "قطع اتصال و پاک کردن اطلاعات",
    pasteRedirectPrompt: "لطفاً آدرس کامل صفحه‌ای که به آن هدایت شدید را وارد کنید.",
  },
  chat: {
    placeholder: "درباره اخبار بپرسید...",
    sendMessage: "ارسال پیام",
    thinking: "دستیار هوش مصنوعی در حال فکر کردن است...",
    greeting: "سلام! من مقالات را خوانده‌ام. چگونه می‌توانم به شما در درک اخبار امروز کمک کنم؟",
    copy: "کپی کردن",
    copied: "کپی شد!",
    like: "پسندیدن",
    dislike: "نپسندیدن",
    share: "به اشتراک گذاشتن",
    shareTitle: "پاسخ از خلاصه‌ساز اخبار با هوش مصنوعی",
  },
};

export type TranslationKeys = typeof fa;