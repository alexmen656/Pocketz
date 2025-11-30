import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAI();

// script doesn't end???
const response = await openai.responses.parse({//openai
    model: "gpt-5-nano",
    input: [
        {
            role: "system",
            content: `Du bist ein Experte für Loyalty-Programme weltweit. Gib die Antwort **als JSON** zurück. Erstelle eine Liste der maximal 50 wichtigsten Treuepunkte-Programme für das angegebene Land.
                      INPUT: [Landname, z.B. "Deutschland", "Frankreich", "USA", etc.]
                              
                      AUFGABE:
                      Identifiziere und priorisiere die wichtigsten Treueprogramme nach:
                      1. Marktreichweite (Anzahl der Teilnehmer)
                      2. Bekanntheit im Land
                      3. Kategorieabdeckung (Einzelhandel, Tankstellen, Online, etc.)
                              
                      KATEGORIEN ZU BERÜCKSICHTIGEN:
                      - Koalitionsprogramme (Multi-Partner wie Payback, DeutschlandCard)
                      - Einzelhandel (Supermärkte, Drogeriemärkte)
                      - Tankstellen & Mobilität
                      - Airlines & Reisen
                      - Online-Shopping & E-Commerce
                      - Restaurants & Gastronomie
                      - Fashion & Lifestyle
                      - Elektronik & Technik
                      - Apotheken & Gesundheit
                              
                      AUSGABEFORMAT (max. 50 Programme):
                      1. [Programmname] - [Kategorie] - [Hauptpartner/Unternehmen]
                      2. [Programmname] - [Kategorie] - [Hauptpartner/Unternehmen]

        AUSGABEFORMAT:
        {"company_name": "Firmenname wie DM, Tesco, ...", category: "Kategorie wie shopping, technik, etc.", hauptteilnehmer: "Hauptpartner oder Unternehmen, bei Payback zB. DM, ..., bei einzelunternehmen nur das unternehmen selbst"} ` },
        {
            role: "user",
            content: "Deutschland",
        },
    ],
    text: {
        format: { type: "json_object" },
    },
});

const type = response;
console.log(JSON.parse(type.output_text).type)