import i18n from "i18next"
import enBot from "./locales/en/bot.json"
import enCommon from "./locales/en/common.json"
import enRps from "./locales/en/rps.json"

import ptBot from "./locales/pt/bot.json"
import ptCommon from "./locales/pt/common.json"
import ptRps from "./locales/pt/rps.json"

i18n.init({
    lng: "pt",
    fallbackLng: "en",
    resources: {
        en: {
            common: enCommon,
            bot: enBot,
            rps: enRps,
        },
        pt: {
            common: ptCommon,
            bot: ptBot,
            rps: ptRps,
        },
    },
    ns: ["common", "bot", "rps"],
    defaultNS: "common",
})

export type TranslationKey =
    | `bot:${keyof typeof enBot}`
    | `common:${keyof typeof enCommon}`
    | `rps:${keyof typeof enRps}`

export function t(key: TranslationKey, options?: any): string {
    return i18n.t(key, options) as string
}
