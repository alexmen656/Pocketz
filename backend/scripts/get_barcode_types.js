//import chatgpt from 'chatgpt';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/*const response = await client.responses.create({
    model: 'gpt-4o',
    instructions: 'You are a coding assistant that talks like a pirate',
    input: 'Are semicolons optional in JavaScript?',
});

console.log(response.output_text);*/

/*const response = await client.responses.create({
    model: 'gpt-5-nano',
    instructions: `
        Du bist ein Barcode-Experte. Gib die Antwort **als JSON** zurück. Identifiziere basierend auf dem Kartennamen den verwendeten Barcode-Typ und Subtyp.
        INPUT: [Kartenname, z.B. "Payback", "Rewe", "Lidl", "dm", etc.]
        
        AUFGABE:
        1. Erkenne den Barcode-Standard der genannten Karte
        2. Bestimme bei Code 128 den spezifischen Subtyp (A, B oder C)
        3. Berücksichtige regionale Standards (Deutschland, Europa, International)
        
        BARCODE-STANDARDS:
        - EAN-13: Europäische Artikelnummer, 13 Ziffern
        - EAN-8: Verkürzte Version, 8 Ziffern
        - Code 128-A: Großbuchstaben, Zahlen, Steuerzeichen
        - Code 128-B: Groß-/Kleinbuchstaben, Zahlen
        - Code 128-C: Nur Zahlenpaare (optimal für lange Nummern)
        - Code 39: Alphanumerisch
        - QR-Code: 2D-Code für komplexe Daten
        - Data Matrix: 2D-Code, kompakt
        
        AUSGABEFORMAT:
        {"type": "Vollstandiger Barcode-Typ inkl. Subtyp, z.B. 'EAN13', 'Code 128B'"}
        `,
    input: 'Payback',
    //response_format: { "type": "json_object" }
    text: {
        format: { "type": "json_object" }//'json'
    }
});

console.log(response.output_text);*/

const openai = new OpenAI();

const response = await openai.responses.parse({
    model: "gpt-5-nano",
    input: [
        {
            role: "system", content: `Du bist ein Barcode-Experte. Gib die Antwort **als JSON** zurück. Identifiziere basierend auf dem Kartennamen den verwendeten Barcode-Typ und Subtyp.
        INPUT: [Kartenname, z.B. "Payback", "Rewe", "Lidl", "dm", etc.]
        
        AUFGABE:
        1. Erkenne den Barcode-Standard der genannten Karte
        2. Bestimme bei Code 128 den spezifischen Subtyp (A, B oder C)
        3. Berücksichtige regionale Standards (Deutschland, Europa, International)
        
        BARCODE-STANDARDS:
        - EAN-13: Europäische Artikelnummer, 13 Ziffern
        - EAN-8: Verkürzte Version, 8 Ziffern
        - Code 128-A: Großbuchstaben, Zahlen, Steuerzeichen
        - Code 128-B: Groß-/Kleinbuchstaben, Zahlen
        - Code 128-C: Nur Zahlenpaare (optimal für lange Nummern)
        - Code 39: Alphanumerisch
        - QR-Code: 2D-Code für komplexe Daten
        - Data Matrix: 2D-Code, kompakt
        
        AUSGABEFORMAT:
        {"type": "Vollstandiger Barcode-Typ inkl. Subtyp, z.B. 'EAN13', 'Code128B'"}` },
        {
            role: "user",
            content: "Payback",
        },
    ],
    text: {
        format: { type: "json_object" },
    },
});

const type = response;//.output_parsed;
//console.log(type);

console.log(JSON.parse(type.output_text).type)