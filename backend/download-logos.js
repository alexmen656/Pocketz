import axios from 'axios';
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getCompaniesByCountry, getAllCountries, updateCompany } from './db_services.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGOS_DIR = join(__dirname, 'logos');

if (!existsSync(LOGOS_DIR)) {
    mkdirSync(LOGOS_DIR, { recursive: true });
}

function getTextColorFromBg(r, g, b) {
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

async function extractColorFromBuffer(buffer) {
    try {
        const { data, info } = await sharp(buffer)
            .raw()
            .toBuffer({ resolveWithObject: true });

        const { width, height, channels } = info;

        const offset = 2;
        const corners = [
            { x: offset, y: offset },
            { x: width - 1 - offset, y: offset },
            { x: offset, y: height - 1 - offset },
            { x: width - 1 - offset, y: height - 1 - offset }
        ];

        const colors = corners.map(({ x, y }) => {
            const idx = (y * width + x) * channels;
            return {
                r: data[idx],
                g: data[idx + 1],
                b: data[idx + 2],
                a: channels === 4 ? data[idx + 3] : 255
            };
        });

        const opaqueColors = colors.filter(c => c.a > 200);

        if (opaqueColors.length === 0) {
            return { bgColor: 'rgb(255, 255, 255)', textColor: '#000000' };
        }

        const tolerance = 30;
        const groups = [];

        for (const color of opaqueColors) {
            let foundGroup = false;
            for (const group of groups) {
                const ref = group[0];
                if (Math.abs(color.r - ref.r) < tolerance &&
                    Math.abs(color.g - ref.g) < tolerance &&
                    Math.abs(color.b - ref.b) < tolerance) {
                    group.push(color);
                    foundGroup = true;
                    break;
                }
            }
            if (!foundGroup) {
                groups.push([color]);
            }
        }

        groups.sort((a, b) => b.length - a.length);
        const dominantGroup = groups[0];

        const avgR = Math.round(dominantGroup.reduce((sum, c) => sum + c.r, 0) / dominantGroup.length);
        const avgG = Math.round(dominantGroup.reduce((sum, c) => sum + c.g, 0) / dominantGroup.length);
        const avgB = Math.round(dominantGroup.reduce((sum, c) => sum + c.b, 0) / dominantGroup.length);

        const bgColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
        const textColor = getTextColorFromBg(avgR, avgG, avgB);

        return { bgColor, textColor };
    } catch (error) {
        console.warn('Error extracting color from buffer:', error.message);
        return { bgColor: '#E53935', textColor: '#FFFFFF' };
    }
}

async function downloadLogo(brandDomain) {
    try {
        const logoUrl = `https://cdn.brandfetch.io/${brandDomain}?c=1idPcHNqxG9p9gPyoFm`;

        const response = await axios.get(logoUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            }
        });

        const contentType = response.headers['content-type'];

        if (contentType?.includes('svg')) {
            console.log(`SVG Format - skipped`);
            return null;
        }

        const buffer = Buffer.from(response.data);

        const metadata = await sharp(buffer).metadata();

        if (!metadata.format || !['jpeg', 'png', 'webp', 'gif', 'tiff'].includes(metadata.format)) {
            console.log(`Unsupported format: ${metadata.format}`);
            return null;
        }

        const pngBuffer = await sharp(buffer)
            .png()
            .resize(180, 180, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toBuffer();

        return pngBuffer;
    } catch (error) {
        if (error.response) {
            console.log(`HTTP ${error.response.status}`);
        } else if (error.code === 'ECONNABORTED') {
            console.log(`Timeout`);
        } else {
            console.log(`${error.message}`);
        }
        return null;
    }
}

async function downloadAllLogos() {
    console.log('Starting Logo-Download & Color Calculation...\n');

    try {
        const countries = await getAllCountries();

        if (countries.length === 0) {
            console.log('Keine Länder in der Datenbank gefunden!');
            return;
        }

        let totalProcessed = 0;
        let successful = 0;
        let failed = 0;
        let skipped = 0;

        for (const country of countries) {
            console.log(`Verarbeite ${country.name}...`);
            const companies = await getCompaniesByCountry(country.name);

            if (companies.length === 0) {
                console.log(`Keine Unternehmen gefunden`);
                continue;
            }

            for (const company of companies) {
                totalProcessed++;

                if (!company.logo) {
                    console.log(`[${totalProcessed}] ${company.name} - kein Logo angegeben`);
                    skipped++;
                    continue;
                }

                const filename = `${company.logo.replace(/\./g, '_')}.png`;
                const filepath = join(LOGOS_DIR, filename);

                let logoBuffer = null;

                if (existsSync(filepath)) {
                    console.log(`[${totalProcessed}] ${company.name} - existiert bereits`);
                    logoBuffer = readFileSync(filepath);
                    skipped++;
                } else {
                    console.log(`[${totalProcessed}] ${company.name}...`);
                    logoBuffer = await downloadLogo(company.logo);

                    if (logoBuffer) {
                        writeFileSync(filepath, logoBuffer);
                        console.log(`Gespeichert: ${filename}`);
                        successful++;
                    } else {
                        console.log(`Download fehlgeschlagen`);
                        failed++;
                    }

                    await new Promise(resolve => setTimeout(resolve, 200));
                }

                if (logoBuffer) {
                    const colors = await extractColorFromBuffer(logoBuffer);
                    const openai = new OpenAI();

                    // the results are shit, pure guesswork, why is everything 128C lol
                    const response = await openai.responses.parse({
                        model: "gpt-5-mini",
                        input: [
                            {
                                role: "system", content: `Du bist ein Barcode-Experte. Gib die Antwort **als JSON** zurück. Identifiziere basierend auf dem Kartennamen den verwendeten Barcode-Typ und Subtyp.
                            INPUT: [Kartenname, z.B. "Payback", "Rewe", "Lidl", "dm", etc.]
                            
                            AUFGABE:
                            1. Erkenne den Barcode-Standard der genannten Karte
                            2. Bestimme bei Code 128 den spezifischen Subtyp (A, B oder C)
                            3. Berücksichtige regionale Standards (Deutschland, Europa, International)
                            
                            BARCODE-STANDARDS:
                            - EAN-13
                            - EAN-8
                            - QR-Code
                            - Code 128-A
                            - Code 128-B
                            - Code 128-C
                            - Code 39
                            - Data Matrix
                            
                            AUSGABEFORMAT:
                            {"type": "Vollstandiger Barcode-Typ inkl. Subtyp, z.B. 'QR', 'EAN13', 'Code128B'"}` },
                            {
                                role: "user",
                                content: "Payback",
                            },
                        ],
                        text: {
                            format: { type: "json_object" },
                        },
                    });

                    const type = JSON.parse(response.output_text).type;

                    await updateCompany(company.id, {
                        bg_color: colors.bgColor,
                        text_color: colors.textColor,
                        barcode_type: type
                    });

                    console.log(`Farben: ${colors.bgColor} / ${colors.textColor}`);
                }
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('Zusammenfassung:');
        console.log(`Gesamt verarbeitet: ${totalProcessed}`);
        console.log(`Erfolgreich: ${successful}`);
        console.log(`Übersprungen: ${skipped}`);
        console.log(`Fehlgeschlagen: ${failed}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('Fehler beim Logo-Download:', error.message);
        throw error;
    }
}

downloadAllLogos().catch(console.error);
