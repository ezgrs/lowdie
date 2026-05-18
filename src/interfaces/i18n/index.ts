import i18n from "i18next"
import enBot from "./locales/en/bot.json" with { type: 'json' }
import enCommon from "./locales/en/common.json" with { type: 'json' }
import enRps from "./locales/en/rps.json" with { type: 'json' }
import enTtt from "./locales/en/ttt.json" with { type: 'json' }

import ptBot from "./locales/pt/bot.json" with { type: 'json' }
import ptCommon from "./locales/pt/common.json" with { type: 'json' }
import ptRps from "./locales/pt/rps.json" with { type: 'json' }
import ptTtt from "./locales/pt/ttt.json" with { type: 'json' }

i18n.init({
    lng: "pt",
    fallbackLng: "en",
    resources: {
        en: {
            common: enCommon,
            bot: enBot,
            rps: enRps,
            ttt: enTtt,
        },
        pt: {
            common: ptCommon,
            bot: ptBot,
            rps: ptRps,
            ttt: ptTtt,
        },
    },
    ns: ["common", "bot", "rps", "ttt"],
    defaultNS: "common",
})

export type TranslationKey =
    | `bot:${keyof typeof enBot}`
    | `common:${keyof typeof enCommon}`
    | `rps:${keyof typeof enRps}`
    | `ttt:${keyof typeof enTtt}`

export function t(key: TranslationKey, options?: any): string {
    return i18n.t(key, options) as string
}
