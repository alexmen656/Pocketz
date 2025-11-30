import { getCompaniesFor } from './get_companies20.js';
import { addCompaniesForCountry } from '../db_services.js';
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
    try {
        let totalAdded = 0;
        let totalSkipped = 0;

        for (const country of allCountries) {
            try {
                console.log(`Processing ${country}...`);
                const companies = await getCompaniesFor(country);

                if (!companies || !Array.isArray(companies)) {
                    console.error(`✗ ${country}: No valid data received from API`);
                    continue;
                }

                // save to json
                const filename = country.toLowerCase().replace(/\s+/g, '_') + '.json';
                const filepath = path.join(countriesDir, filename);
                fs.writeFileSync(filepath, JSON.stringify(companies, null, 2), 'utf-8');
                console.log(`JSON created: ${filename}`);

                // save to database
                const result = await addCompaniesForCountry(country, companies);
                totalAdded += result.addedCount;
                totalSkipped += result.skippedCount;
                console.log(`DB: ${result.addedCount} added, ${result.skippedCount} skipped`);
            } catch (error) {
                console.error(`Error processing ${country}:`, error.message);
            }
        }

        console.log(`Completed!`);
        console.log(`Total added: ${totalAdded}`);
        console.log(`Total skipped: ${totalSkipped}`);
        process.exit(0);
    } catch (error) {
        console.error('Critical error:', error.message);
        process.exit(1);
    }
})();


/*
JSON created: deutschland.json
✓ 0 Unternehmen für Deutschland hinzugefügt, 20 übersprungen
DB: 0 added, 20 skipped
Processing Frankreich...
herere

⚠ Fehler beim Hinzufügen von "undefined" für Deutschland: null value in column "name" of relation "companies" violates not-null constraint
⚠ Fehler beim Hinzufügen von "undefined" für Deutschland: null value in column "name" of relation "companies" violates not-null constraint
⚠ Fehler beim Hinzufügen von "undefined" für Deutschland: null value in column "name" of relation "companies" violates not-null constraint
⚠ Fehler beim Hinzufügen von "undefined" für Deutschland: null value in column "name" of relation "companies" violates not-null constraint
⚠ Fehler beim Hinzufügen von "undefined" für Deutschland: null value in column "name" of relation "companies" violates not-null constraint


JSON created: deutschland.json
✓ 14 Unternehmen für Deutschland hinzugefügt, 0 übersprungen
DB: 14 added, 0 skipped
Processing Frankreich...

yupee!!!
*/