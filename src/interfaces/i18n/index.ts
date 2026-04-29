import i18n from "i18next"
import en from "./locales/en/bot.json"

i18n.init({
    lng: "pt",
    fallbackLng: "en",
    resources: {
        en: { bot: require("./locales/en/bot.json") },
        pt: { bot: require("./locales/pt/bot.json") },
    },
    defaultNS: "bot",
})

export type TranslationKey = keyof typeof en

export function t(key: TranslationKey, options?: any): string {
    return i18n.t(key, options) as string
}
