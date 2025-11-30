import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

export async function getCompaniesFor(country) {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAI();

    console.log('herere');
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
                    
                    !!! Beachte: !!!
                    Nur Programme, die einen barcode, QR-Code oder eine digitale oder physische Karte verwenden, sind relevant. Es ist recht offen aber kein Amazon prime, oder ähnliches.
                    Programme bei denen der code komplett dynamisch ist, wie in der Mc Donalds App, sind auch ausgeschlossen.

                    AUSGABEFORMAT (max. 20 Programme):
                    programs: [{"company_name": "Firmenname wie DM, Tesco, ..., ohne GmbH, (Lufthansa Group), (Deutsche Bahn) Endungen oder ähnliches", category: "Kategorie wie shopping, technik, etc.", hauptteilnehmer: "Hauptpartner oder Unternehmen, bei Payback zB. DM, Aral, ..., bei einzelunternehmen nur das unternehmen selbst",  "logo": "Trotz dessen das der key logo ist, musst du hier die website des Unternehmens angeben, z.B. dm.de, payback.de, wichtig!!! ohne https:// oder www."}] ` },
            {
                role: "user",
                content: country,
            },
        ],
        text: {
            format: { type: "json_object" },
            //  format: { company_name: "string", category: "string", hauptteilnehmer: "string" },
        },
        /*
                text: {
                    format: {
                        type: "json_object",
                        properties: {
                            company_name: { type: "string" },
                            category: { type: "string" },
                            hauptteilnehmer: { type: "string" }
                        },
                        required: ["company_name", "category", "hauptteilnehmer"]
                    }
                }*/
    });

    const type = response;
    console.log('finished');
    console.log('API Response:', JSON.stringify(type, null, 2));

    if (!type || !type.output_text) {
        console.error('Invalid response structure:', type);
        return [];
    }

    return JSON.parse(type.output_text).programs;
}

//main();


/*
output_text: '{\n' +
    '  "programs": [\n' +
    '    {"company_name": "Payback", "category": "Koalitionsprogramm", "hauptteilnehmer": "dm-drogerie markt"},\n' +
    '    {"company_name": "DeutschlandCard", "category": "Koalitionsprogramm", "hauptteilnehmer": "real,-"},\n' +
    '    {"company_name": "Miles & More", "category": "Airlines & Reisen", "hauptteilnehmer": "Lufthansa"},\n' +
    '    {"company_name": "BahnBonus", "category": "Tankstellen & Mobilität", "hauptteilnehmer": "Deutsche Bahn"},\n' +
    '    {"company_name": "IKEA Family", "category": "Einzelhandel", "hauptteilnehmer": "IKEA"},\n' +
    '    {"company_name": "Douglas Card", "category": "Einzelhandel", "hauptteilnehmer": "Douglas"},\n' +
    '    {"company_name": "Lidl Plus", "category": "Einzelhandel", "hauptteilnehmer": "Lidl"},\n' +
    '    {"company_name": "H&M Club", "category": "Fashion & Lifestyle", "hauptteilnehmer": "H&M"},\n' +
    '    {"company_name": "Zalando Plus", "category": "Online-Shopping & E-Commerce", "hauptteilnehmer": "Zalando"},\n' +
    '    {"company_name": "Amazon Prime", "category": "Online-Shopping & E-Commerce", "hauptteilnehmer": "Amazon"},\n' +
    '    {"company_name": "Sixt Rewards", "category": "Tankstellen & Mobilität", "hauptteilnehmer": "Sixt"},\n' +
    '    {"company_name": "Adidas Creators Club", "category": "Fashion & Lifestyle", "hauptteilnehmer": "Adidas"},\n' +
    '    {"company_name": "Deichmann Card", "category": "Fashion & Lifestyle", "hauptteilnehmer": "Deichmann"},\n' +
    '    {"company_name": "Müller BonusCard", "category": "Einzelhandel", "hauptteilnehmer": "Müller"},\n' +
    '    {"company_name": "Rossmann Card", "category": "Apotheken & Gesundheit", "hauptteilnehmer": "Rossmann"},\n' +
    '    {"company_name": "Thalia Bonus Card", "category": "Einzelhandel", "hauptteilnehmer": "Thalia"},\n' +
    '    {"company_name": "TchiboCard", "category": "Einzelhandel", "hauptteilnehmer": "Tchibo"},\n' +
    '    {"company_name": "Booking.com Genius", "category": "Airlines & Reisen", "hauptteilnehmer": "Booking.com"},\n' +
    `    {"company_name": "McDonald's App", "category": "Restaurants & Gastronomie", "hauptteilnehmer": "McDonald's Deutschland"},\n` +
    '    {"company_name": "Otto Bonus Card", "category": "Online-Shopping & E-Commerce", "hauptteilnehmer": "Otto"}\n' +
    '  ]\n' +
    '}',
  output_parsed: [Getter]
}*/