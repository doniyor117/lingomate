import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useStoredValue } from './storage';
import { getLanguageByCode } from './languages';

/** Interface languages; "system" follows the browser/OS language. */
export const UI_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'uz', name: 'O‘zbekcha' },
    { code: 'ru', name: 'Русский' },
] as const;

export type UiLanguage = (typeof UI_LANGUAGES)[number]['code'];
export const SYSTEM_UI_LANGUAGE = 'system';

const en = {
    'app.tagline': 'Smart translations with context',
    'app.disclaimer': 'LumenAI is AI and can make mistakes.',
    'header.install': 'Install',
    'header.settings': 'Settings',
    'header.history': 'View history',

    'lang.auto': 'Auto Detect',
    'lang.select': 'Select language',
    'lang.from': 'Translate from',
    'lang.to': 'Translate to',
    'lang.selectSource': 'Select source language',
    'lang.selectTarget': 'Select target language',
    'lang.swap': 'Swap languages',
    'lang.search': 'Search languages…',
    'lang.notFound': 'No languages found for “{q}”',

    'mode.auto.label': 'Auto',
    'mode.auto.desc': 'Dictionary for up to {n} words, Translate for longer text',
    'mode.auto.placeholder': 'Enter a word or text…',
    'mode.dictionary.label': 'Dictionary',
    'mode.dictionary.desc': 'Meanings, examples and pronunciation',
    'mode.dictionary.placeholder': 'Enter a word or phrase…',
    'mode.translate.label': 'Translate',
    'mode.translate.desc': 'Natural translation of sentences and text',
    'mode.translate.placeholder': 'Enter text to translate…',
    'mode.find.label': 'Find a word',
    'mode.find.desc': 'Describe something, get the word for it',
    'mode.find.placeholder': 'Describe the word you’re looking for…',
    'mode.button': 'Mode: {mode}',

    'input.clear': 'Clear text',
    'input.mic': 'Voice input',
    'input.listen': 'Listen to input',
    'input.context': 'Context',
    'input.contextHint': 'Add context (tone, audience, topic)',
    'input.contextPlaceholder': 'Add context (e.g. formal email, technical documentation)',
    'input.send': 'Translate',
    'input.sendHint': 'Translate (Ctrl+Enter)',
    'input.stop': 'Stop',
    'preset.formal': 'Formal 💼',
    'preset.casual': 'Casual 💬',
    'preset.slang': 'Slang 🎭',
    'preset.technical': 'Technical 💻',
    'speech.unsupported': 'Speech recognition is not supported in this browser. Please use Chrome or Edge.',

    'result.placeholder': 'Translation will appear here…',
    'result.detected': 'Detected:',
    'result.corrected': 'Already in {lang} · showing a grammar-corrected version',
    'result.listen': 'Listen',
    'result.listenTo': 'Listen to {text}',
    'result.playing': 'Playing…',
    'result.noVoice': 'No {lang} voice',
    'result.noVoiceHint': 'This device has no voice for this language',
    'result.copy': 'Copy',
    'result.copied': 'Copied',
    'register.formal': 'formal',
    'register.informal': 'informal',
    'register.slang': 'slang',
    'register.internet': 'internet',
    'register.vulgar': 'vulgar',

    'error.failed': 'Translation failed. Please try again.',
    'error.unreadable': 'Couldn’t read the response. Please try again.',

    'toast.failed': '{model} failed',
    'toast.using': 'Using {model} instead for the next {n} minutes.',
    'toast.usingOnce': 'Using {model} instead.',
    'toast.dismiss': 'Dismiss notification',

    'settings.title': 'Settings',
    'settings.close': 'Close settings',
    'settings.theme': 'Theme',
    'settings.themeDesc': 'Light, dark or match your device',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'Match device',
    'settings.language': 'App language',
    'settings.languageDesc': 'Language of menus and buttons',
    'settings.languageSystem': 'System ({lang})',
    'settings.model': 'Model',
    'settings.modelDesc': 'Used for all modes. If it fails, LumenAI switches to the other model for 15 minutes.',
    'settings.modelAuto': 'Auto (Smart Selection)',
    'settings.done': 'Done',
    'settings.updated': 'Updated {date}',

    'install.title': 'Install LumenAI',
    'install.available': 'Opens instantly from your home screen and works offline.',
    'install.ios': 'In Safari, tap Share, then “Add to Home Screen”.',
    'install.manual': 'Open your browser menu and choose “Install app” or “Add to Home screen”.',
    'install.button': 'Install',

    'history.title': 'History',
    'history.clearAll': 'Clear all',
    'history.confirmClear': 'Clear all translation history?',
    'history.close': 'Close history',
    'history.empty': 'No translations yet',
    'history.delete': 'Delete entry',
    'time.now': 'Just now',
};

export type MessageKey = keyof typeof en;
type Messages = Record<MessageKey, string>;

const uz: Messages = {
    'app.tagline': 'Kontekstni tushunadigan aqlli tarjimon',
    'app.disclaimer': 'LumenAI — sun’iy intellekt, u xato qilishi mumkin.',
    'header.install': 'O‘rnatish',
    'header.settings': 'Sozlamalar',
    'header.history': 'Tarixni ko‘rish',

    'lang.auto': 'Avtoaniqlash',
    'lang.select': 'Tilni tanlang',
    'lang.from': 'Qaysi tildan',
    'lang.to': 'Qaysi tilga',
    'lang.selectSource': 'Manba tilni tanlash',
    'lang.selectTarget': 'Tarjima tilini tanlash',
    'lang.swap': 'Tillarni almashtirish',
    'lang.search': 'Tilni qidirish…',
    'lang.notFound': '“{q}” bo‘yicha til topilmadi',

    'mode.auto.label': 'Avto',
    'mode.auto.desc': '{n} tagacha so‘z — Lug‘at, uzunroq matn — Tarjima',
    'mode.auto.placeholder': 'So‘z yoki matn kiriting…',
    'mode.dictionary.label': 'Lug‘at',
    'mode.dictionary.desc': 'Ma’nolar, misollar va talaffuz',
    'mode.dictionary.placeholder': 'So‘z yoki ibora kiriting…',
    'mode.translate.label': 'Tarjima',
    'mode.translate.desc': 'Gap va matnlarning tabiiy tarjimasi',
    'mode.translate.placeholder': 'Tarjima uchun matn kiriting…',
    'mode.find.label': 'So‘z topish',
    'mode.find.desc': 'Ta’riflang — so‘zini topib beramiz',
    'mode.find.placeholder': 'Qidirayotgan so‘zingizni ta’riflang…',
    'mode.button': 'Rejim: {mode}',

    'input.clear': 'Matnni tozalash',
    'input.mic': 'Ovozli kiritish',
    'input.listen': 'Matnni tinglash',
    'input.context': 'Kontekst',
    'input.contextHint': 'Kontekst qo‘shish (ohang, auditoriya, mavzu)',
    'input.contextPlaceholder': 'Kontekst qo‘shing (masalan, rasmiy xat, texnik hujjat)',
    'input.send': 'Tarjima qilish',
    'input.sendHint': 'Tarjima qilish (Ctrl+Enter)',
    'input.stop': 'To‘xtatish',
    'preset.formal': 'Rasmiy 💼',
    'preset.casual': 'Norasmiy 💬',
    'preset.slang': 'Sleng 🎭',
    'preset.technical': 'Texnik 💻',
    'speech.unsupported': 'Bu brauzer ovozni tanimaydi. Chrome yoki Edge’dan foydalaning.',

    'result.placeholder': 'Tarjima shu yerda chiqadi…',
    'result.detected': 'Aniqlandi:',
    'result.corrected': 'Til: {lang} · xatolari tuzatilgan variant',
    'result.listen': 'Tinglash',
    'result.listenTo': 'Tinglash: {text}',
    'result.playing': 'O‘qilmoqda…',
    'result.noVoice': 'Ovoz yo‘q ({lang})',
    'result.noVoiceHint': 'Bu qurilmada ushbu til uchun ovoz yo‘q',
    'result.copy': 'Nusxalash',
    'result.copied': 'Nusxalandi',
    'register.formal': 'rasmiy',
    'register.informal': 'so‘zlashuv',
    'register.slang': 'sleng',
    'register.internet': 'internet',
    'register.vulgar': 'qo‘pol',

    'error.failed': 'Tarjima amalga oshmadi. Qaytadan urinib ko‘ring.',
    'error.unreadable': 'Javobni o‘qib bo‘lmadi. Qaytadan urinib ko‘ring.',

    'toast.failed': '{model} ishlamadi',
    'toast.using': 'Keyingi {n} daqiqa davomida {model} ishlatiladi.',
    'toast.usingOnce': 'Uning o‘rniga {model} ishlatildi.',
    'toast.dismiss': 'Bildirishnomani yopish',

    'settings.title': 'Sozlamalar',
    'settings.close': 'Sozlamalarni yopish',
    'settings.theme': 'Mavzu',
    'settings.themeDesc': 'Yorug‘, qorong‘i yoki qurilmadagidek',
    'theme.light': 'Yorug‘',
    'theme.dark': 'Qorong‘i',
    'theme.system': 'Qurilmadagidek',
    'settings.language': 'Ilova tili',
    'settings.languageDesc': 'Menyu va tugmalar tili',
    'settings.languageSystem': 'Tizim tili ({lang})',
    'settings.model': 'Model',
    'settings.modelDesc': 'Barcha rejimlar uchun. Ishlamay qolsa, LumenAI 15 daqiqaga boshqa modelga o‘tadi.',
    'settings.modelAuto': 'Avto (aqlli tanlov)',
    'settings.done': 'Tayyor',
    'settings.updated': 'Yangilangan: {date}',

    'install.title': 'LumenAI’ni o‘rnating',
    'install.available': 'Bosh ekrandan bir zumda ochiladi va internetsiz ham ishlaydi.',
    'install.ios': 'Safari’da «Ulashish»ni, so‘ng «Bosh ekranga qo‘shish»ni bosing.',
    'install.manual': 'Brauzer menyusini ochib, «Ilovani o‘rnatish» yoki «Bosh ekranga qo‘shish»ni tanlang.',
    'install.button': 'O‘rnatish',

    'history.title': 'Tarix',
    'history.clearAll': 'Tozalash',
    'history.confirmClear': 'Butun tarix o‘chirilsinmi?',
    'history.close': 'Tarixni yopish',
    'history.empty': 'Hali tarjimalar yo‘q',
    'history.delete': 'O‘chirish',
    'time.now': 'Hozirgina',
};

const ru: Messages = {
    'app.tagline': 'Умный перевод с учётом контекста',
    'app.disclaimer': 'LumenAI — это ИИ, он может ошибаться.',
    'header.install': 'Установить',
    'header.settings': 'Настройки',
    'header.history': 'Открыть историю',

    'lang.auto': 'Автоопределение',
    'lang.select': 'Выберите язык',
    'lang.from': 'Перевести с',
    'lang.to': 'Перевести на',
    'lang.selectSource': 'Выбрать исходный язык',
    'lang.selectTarget': 'Выбрать язык перевода',
    'lang.swap': 'Поменять языки',
    'lang.search': 'Поиск языка…',
    'lang.notFound': 'По запросу «{q}» языков не найдено',

    'mode.auto.label': 'Авто',
    'mode.auto.desc': 'До {n} слов — Словарь, длиннее — Перевод',
    'mode.auto.placeholder': 'Введите слово или текст…',
    'mode.dictionary.label': 'Словарь',
    'mode.dictionary.desc': 'Значения, примеры и произношение',
    'mode.dictionary.placeholder': 'Введите слово или фразу…',
    'mode.translate.label': 'Перевод',
    'mode.translate.desc': 'Естественный перевод предложений и текстов',
    'mode.translate.placeholder': 'Введите текст для перевода…',
    'mode.find.label': 'Найти слово',
    'mode.find.desc': 'Опишите — подберём слово',
    'mode.find.placeholder': 'Опишите слово, которое ищете…',
    'mode.button': 'Режим: {mode}',

    'input.clear': 'Очистить текст',
    'input.mic': 'Голосовой ввод',
    'input.listen': 'Прослушать текст',
    'input.context': 'Контекст',
    'input.contextHint': 'Добавить контекст (тон, аудитория, тема)',
    'input.contextPlaceholder': 'Добавьте контекст (например, деловое письмо, техническая документация)',
    'input.send': 'Перевести',
    'input.sendHint': 'Перевести (Ctrl+Enter)',
    'input.stop': 'Остановить',
    'preset.formal': 'Официально 💼',
    'preset.casual': 'Неформально 💬',
    'preset.slang': 'Сленг 🎭',
    'preset.technical': 'Технический 💻',
    'speech.unsupported': 'Этот браузер не поддерживает распознавание речи. Используйте Chrome или Edge.',

    'result.placeholder': 'Здесь появится перевод…',
    'result.detected': 'Определено:',
    'result.corrected': 'Язык: {lang} · исправленный вариант',
    'result.listen': 'Прослушать',
    'result.listenTo': 'Прослушать: {text}',
    'result.playing': 'Воспроизведение…',
    'result.noVoice': 'Нет голоса ({lang})',
    'result.noVoiceHint': 'На этом устройстве нет голоса для этого языка',
    'result.copy': 'Копировать',
    'result.copied': 'Скопировано',
    'register.formal': 'офиц.',
    'register.informal': 'разг.',
    'register.slang': 'сленг',
    'register.internet': 'интернет',
    'register.vulgar': 'груб.',

    'error.failed': 'Не удалось перевести. Попробуйте ещё раз.',
    'error.unreadable': 'Не удалось прочитать ответ. Попробуйте ещё раз.',

    'toast.failed': '{model} не ответила',
    'toast.using': 'Следующие {n} мин. используется {model}.',
    'toast.usingOnce': 'Вместо неё использована {model}.',
    'toast.dismiss': 'Закрыть уведомление',

    'settings.title': 'Настройки',
    'settings.close': 'Закрыть настройки',
    'settings.theme': 'Тема',
    'settings.themeDesc': 'Светлая, тёмная или как на устройстве',
    'theme.light': 'Светлая',
    'theme.dark': 'Тёмная',
    'theme.system': 'Как на устройстве',
    'settings.language': 'Язык приложения',
    'settings.languageDesc': 'Язык меню и кнопок',
    'settings.languageSystem': 'Системный ({lang})',
    'settings.model': 'Модель',
    'settings.modelDesc': 'Используется во всех режимах. При сбое LumenAI на 15 минут переключится на другую модель.',
    'settings.modelAuto': 'Авто (умный выбор)',
    'settings.done': 'Готово',
    'settings.updated': 'Обновлено: {date}',

    'install.title': 'Установите LumenAI',
    'install.available': 'Открывается с главного экрана и работает офлайн.',
    'install.ios': 'В Safari нажмите «Поделиться», затем «На экран „Домой“».',
    'install.manual': 'Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».',
    'install.button': 'Установить',

    'history.title': 'История',
    'history.clearAll': 'Очистить',
    'history.confirmClear': 'Очистить всю историю переводов?',
    'history.close': 'Закрыть историю',
    'history.empty': 'Пока нет переводов',
    'history.delete': 'Удалить запись',
    'time.now': 'Только что',
};

const MESSAGES: Record<UiLanguage, Messages> = { en, uz, ru };

// Browsers ship almost no Uzbek locale data (Intl.DisplayNames returns codes, dates
// come out as "2026 M09 25"), so Uzbek names and dates are provided here.
const UZ_LANGUAGE_NAMES: Record<string, string> = {
    en: 'Ingliz', uz: 'O‘zbek', ru: 'Rus', zh: 'Xitoy', es: 'Ispan', hi: 'Hind', ar: 'Arab',
    ja: 'Yapon', pt: 'Portugal', fr: 'Fransuz', de: 'Nemis', it: 'Italyan', ko: 'Koreys',
    tr: 'Turk', af: 'Afrikaans', am: 'Amxar', az: 'Ozarbayjon', bn: 'Bengal', bg: 'Bolgar',
    my: 'Birma', ca: 'Katalan', hr: 'Xorvat', cs: 'Chex', da: 'Daniya', nl: 'Niderland',
    et: 'Eston', fi: 'Fin', el: 'Yunon', gu: 'Gujarot', he: 'Ivrit', hu: 'Venger',
    is: 'Island', id: 'Indonez', jw: 'Yava', kn: 'Kannada', kk: 'Qozoq', km: 'Kxmer',
    sw: 'Suaxili', lo: 'Laos', lv: 'Latish', lt: 'Litva', mk: 'Makedon', ms: 'Malay',
    ml: 'Malayalam', mr: 'Maratxi', mn: 'Mo‘g‘ul', ne: 'Nepal', no: 'Norveg', fa: 'Fors',
    pl: 'Polyak', pa: 'Panjob', ro: 'Rumin', sr: 'Serb', si: 'Singal', sk: 'Slovak',
    sl: 'Sloven', sv: 'Shved', ta: 'Tamil', te: 'Telugu', ky: 'Qirg‘iz', tk: 'Turkman',
};

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

/** A date like "25-sentabr, 2026" / "25 сент. 2026 г." / "Sep 25, 2026". */
export function formatDate(timestamp: number, uiLang: UiLanguage, withYear = true): string {
    const date = new Date(timestamp);
    if (uiLang === 'uz') {
        const day = `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}`;
        return withYear ? `${day}, ${date.getFullYear()}` : day;
    }
    return date.toLocaleDateString(uiLang, withYear
        ? { day: 'numeric', month: 'short', year: 'numeric' }
        : { day: 'numeric', month: 'short' });
}

/** "5 min ago"-style time for recent entries, a short date for older ones. */
export function formatRelativeTime(timestamp: number, uiLang: UiLanguage, justNow: string): string {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return justNow;
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days >= 7) return formatDate(timestamp, uiLang, false);

    const [value, unit] = hours < 1 ? [minutes, 'minute'] as const : days < 1 ? [hours, 'hour'] as const : [days, 'day'] as const;
    if (uiLang === 'uz') {
        return `${value} ${{ minute: 'daqiqa', hour: 'soat', day: 'kun' }[unit]} oldin`;
    }
    return new Intl.RelativeTimeFormat(uiLang, { numeric: 'auto', style: 'short' }).format(-value, unit);
}

const isUiLanguage = (v: string): v is UiLanguage => v in MESSAGES;
const isUiPreference = (v: string) => v === SYSTEM_UI_LANGUAGE || isUiLanguage(v);

/** The interface language matching the browser/OS, or English. */
function systemUiLanguage(browserLanguage: string): UiLanguage {
    const base = browserLanguage.toLowerCase().split('-')[0];
    return isUiLanguage(base) ? base : 'en';
}

const noSubscribe = () => () => { };

export function useI18n() {
    const [preference, setPreference] = useStoredValue<string>('lumen_ui_lang', SYSTEM_UI_LANGUAGE, isUiPreference);
    const browserLanguage = useSyncExternalStore(noSubscribe, () => navigator.language, () => 'en');
    const systemLanguage = systemUiLanguage(browserLanguage);
    const uiLang: UiLanguage = isUiLanguage(preference) ? preference : systemLanguage;

    const t = useCallback((key: MessageKey, vars?: Record<string, string | number>) => {
        const template = MESSAGES[uiLang][key] ?? en[key];
        return vars ? template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? '')) : template;
    }, [uiLang]);

    const displayNames = useMemo(() => {
        try {
            return new Intl.DisplayNames([uiLang], { type: 'language' });
        } catch {
            return null;
        }
    }, [uiLang]);

    /** A translation language's name in the interface language. */
    const languageName = useCallback((code: string) => {
        if (code === 'auto') return t('lang.auto');
        if (uiLang === 'uz' && UZ_LANGUAGE_NAMES[code]) return UZ_LANGUAGE_NAMES[code];
        let name: string | undefined;
        try {
            name = displayNames?.of(code);
        } catch {
            name = undefined;
        }
        if (!name || name === code) name = getLanguageByCode(code)?.name ?? code;
        return name.charAt(0).toLocaleUpperCase(uiLang) + name.slice(1);
    }, [displayNames, t, uiLang]);

    return { t, uiLang, preference, setPreference, systemLanguage, languageName };
}

/** Keeps <html lang> in sync with the interface language. */
export function useHtmlLang(uiLang: UiLanguage) {
    useEffect(() => {
        document.documentElement.lang = uiLang;
    }, [uiLang]);
}
