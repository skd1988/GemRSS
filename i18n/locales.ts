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
    loadingMessage: "در حال خلاصه کردن مقالات... این ممکن است کمی طول بکشد.",
    authMessage: "در حال احراز هویت با Inoreader...",
    error: "خطا",
    summarizeError: "خطایی رخ داد: {error}",
    emptyFeedError: "فید خالی است یا قابل خواندن نیست.",
    opmlFetchError: "امکان دریافت هیچ یک از فیدهای فایل OPML وجود نداشت. ممکن است به دلیل درخواست‌های ناموفق یا فیدهای خصوصی Inoreader که نیاز به اعتبارنامه دارند، باشد.",
    allFeedsFetchError: "امکان دریافت هیچ یک از فیدهای ارائه شده وجود نداشت. لطفاً آدرس‌ها و اتصال اینترنت خود را بررسی کنید.",
    opmlParseError: "خطایی هنگام پردازش فایل OPML رخ داد: {error}",
    noArticles: "هیچ مقاله‌ای برای خلاصه‌سازی از این فید یافت نشد.",
    authFailed: "احراز هویت ناموفق بود: {error}",
    inoreaderAuthFailed: "احراز هویت Inoreader ناموفق بود: {error}",
    inoreaderCredsError: "احراز هویت ناموفق بود: اعتبارنامه‌های موقت یافت نشد. لطفاً دوباره لینک احراز هویت را ایجاد کنید.",
  },
  startScreen: {
    title: 'اخبار شما، <span class="text-orange-400">به صورت خلاصه</span>.',
    subtitle: "یک یا چند آدرس فید RSS را (هر کدام در یک خط) وارد کنید تا خلاصه‌های مبتنی بر هوش مصنوعی را دریافت کنید که به طور خودکار در دسته‌بندی‌های مختلف مرتب شده‌اند.",
    placeholder: "https://example.com/rss\nhttps://another-site.com/feed.xml",
    rssUrlLabel: "آدرس(های) فید RSS",
    submitButton: "خلاصه کن",
    examplePrompt: "به یک مثال نیاز دارید؟",
    exampleLink: "فید RSS سایت The Verge را امتحان کنید.",
    opmlPrompt: "یا",
    opmlLink: "یک فایل OPML آپلود کنید",
    opmlHint: "تا چندین فید را همزمان خلاصه کنید.",
    opmlLabel: "آپلود فایل OPML",
    predefinedLoading: "در حال بارگذاری اخبار...",
    predefinedError: "بارگذاری فیدهای خبری از پیش تعریف شده ناموفق بود: {error}",
    supporters: "اخبار حامیان مقاومت",
    opponents: "اخبار مخالفان مقاunt",
    countryNews: "اخبار {countryName}",
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
};

export type TranslationKeys = typeof fa;