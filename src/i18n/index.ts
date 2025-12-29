import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import sk from './locales/sk.json'
import cz from './locales/cz.json'
import fr from './locales/fr.json'
import it from './locales/it.json'
import pt from './locales/pt.json'
import nl from './locales/nl.json'
import pl from './locales/pl.json'
import sv from './locales/sv.json'
import da from './locales/da.json'
import no from './locales/no.json'
import fi from './locales/fi.json'
import el from './locales/el.json'
import hu from './locales/hu.json'
import ro from './locales/ro.json'
import uk from './locales/uk.json'
import hr from './locales/hr.json'
import bg from './locales/bg.json'
import ru from './locales/ru.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('app-locale') || 'en',
  fallbackLocale: 'en',
  messages: {
    de,
    en,
    es,
    sk,
    cz,
    fr,
    it,
    pt,
    nl,
    pl,
    sv,
    da,
    no,
    fi,
    el,
    hu,
    ro,
    uk,
    hr,
    bg,
    ru,
  },
})

export default i18n
