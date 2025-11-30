import { getCompaniesFor } from './get_companies20.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const countriesDir = path.join(__dirname, '../../countries');

if (!fs.existsSync(countriesDir)) {
    fs.mkdirSync(countriesDir, { recursive: true });
}

// conutries which make sense for companies, countries like kiribati, east timor, vatican etc are excluded
const allCountries = [
    "Deutschland",
    "Frankreich",
    "Spanien",
    "Italien",
    "Vereinigtes Königreich",
    "Polen",
    "Niederlande",
    "Belgien",
    "Österreich",
    "Schweiz",
    "Schweden",
    "Norwegen",
    "Dänemark",
    "Finnland",
    "Irland",
    "Portugal",
    "Griechenland",
    "Tschechien",
    "Ungarn",
    "Slowakei",
    "Rumänien",
    "Kroatien",
    "Bulgarien",
    "Serbien",
    "Slowenien",
    "Litauen",
    "Lettland",
    "Estland",
    "Luxemburg",
    "Island",
    "Malta",
    "Zypern",
    "Ukraine",
    "USA",
    "Kanada",
    "Mexiko",
    "Japan",
    "China",
    "Südkorea",
    "Australien",
    "Indien",
    "Singapur",
    "Neuseeland",
    "Hongkong",
    "Taiwan",
    "Thailand",
    "Malaysia",
    "Indonesien",
    "Philippinen",
    "Vietnam",
    "Vereinigte Arabische Emirate",
    "Brasilien",
    "Argentinien",
    "Chile",
    "Kolumbien",
    "Saudi-Arabien",
    "Israel",
    "Türkei",
    "Katar",
    "Südafrika",
    "Ägypten",
    "Russland",
    "Georgien"
];

(async () => {
    for (const country of allCountries) {
        try {
            console.log(`workingg ${country}...`);
            const companies = await getCompaniesFor(country);
            const filename = country.toLowerCase().replace(/\s+/g, '_') + '.json';
            const filepath = path.join(countriesDir, filename);

            fs.writeFileSync(filepath, JSON.stringify(companies, null, 2), 'utf-8');
            console.log(`✓ ${country} saved in ${filename}`);
        } catch (error) {
            console.error(`eroor ${country}:`, error.message);
        }
    }
    console.log('finisheeeeeed');
})();