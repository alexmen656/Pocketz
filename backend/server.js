import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'passkit-generator';
const { PKPass } = pkg;
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sharp from 'sharp';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/logos', express.static(join(__dirname, 'logos')));

const loadCompanies = () => {
    try {
        const companiesPath = join(__dirname, 'companies.json');
        return JSON.parse(readFileSync(companiesPath, 'utf-8'));
    } catch (error) {
        console.error('Error loading companies:', error);
        return [];
    }
};

const loadCertificates = () => {
    try {
        const certsPath = join(__dirname, './certs')

        return {
            wwdr: readFileSync(join(certsPath, 'AppleWWDRCAG4.pem')),
            signerCert: readFileSync(join(certsPath, 'pass.pem')),
            signerKey: readFileSync(join(certsPath, 'my-key.key')),
            signerKeyPassphrase: process.env.SIGNER_PASSPHRASE || ''
        };
    } catch (error) {
        console.error('Error loading certificates:', error);
        throw error;
    }
};

const loadImages = (customImages = {}) => {
    try {
        const modelsPath = join(__dirname, './models');

        return {
            'icon.png': readFileSync(join(modelsPath, 'icon.png')),
            'icon@2x.png': readFileSync(join(modelsPath, 'icon@2x.png')),
            ...customImages
        };
    } catch (error) {
        console.error('Error loading images:', error);
        throw error;
    }
};

const fetchBrandLogo = async (brandDomain) => {
    try {
        const logoUrl = `https://cdn.brandfetch.io/${brandDomain}?c=1idPcHNqxG9p9gPyoFm`;

        const response = await axios.get(logoUrl, {
            responseType: 'stream',
            headers: {
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
                'Referer': 'https://your-website.com'
            }
        });

        console.log(`Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers['content-type']}`);

        const contentType = response.headers['content-type'];

        if (contentType?.includes('svg')) {
            console.log('SVG recognised - will be skipped');
            return null;
        }

        const chunks = [];
        for await (const chunk of response.data) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        try {
            const metadata = await sharp(buffer).metadata();

            if (!metadata.format || !['jpeg', 'png', 'webp', 'gif', 'tiff'].includes(metadata.format)) {
                console.log(`unsupported Format: ${metadata.format}`);
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
        } catch (sharpError) {
            console.warn(`Sharp-Error for ${brandDomain}:`, sharpError.message);
            return null;
        }
    } catch (error) {
        if (error.response) {
            console.warn(`Logo fetch failed for ${brandDomain}: HTTP ${error.response.status}`);
        } else if (error.code === 'ECONNABORTED') {
            console.warn(`Timeout loading logo for ${brandDomain}`);
        } else {
            console.warn(`Error loading logo for ${brandDomain}:`, error.message);
        }
        return null;
    }
};

function hexToRgb(hex) {
    hex = hex.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgb(${r}, ${g}, ${b})`;
}

function normalizeColor(color) {
    if (!color) return 'rgb(60, 65, 76)';

    if (color.startsWith('rgb(')) {
        return color;
    }

    if (color.startsWith('#')) {
        return hexToRgb(color);
    }

    if (/^[0-9A-Fa-f]{6}$/.test(color)) {
        return hexToRgb(color);
    }

    return color;
}

async function generatePass(cardData) {
    console.log('Generating pass for card:', cardData.name);

    const certificates = loadCertificates();

    let logoBuffer = null;
    if (cardData.logo) {
        logoBuffer = await fetchBrandLogo(cardData.logo);
    }

    const customImages = {};
    if (logoBuffer) {
        customImages['logo.png'] = logoBuffer;
        customImages['logo@2x.png'] = logoBuffer;
    }

    //images are not whowing up maybe because of wrong sizes
    const images = loadImages(customImages);

    let bgColor = normalizeColor(cardData.bgColor) || 'rgb(60, 65, 76)';
    let textColor = normalizeColor(cardData.textColor) || 'rgb(255, 255, 255)';

    const pass = new PKPass(
        images,
        {
            signerCert: certificates.signerCert,
            signerKey: certificates.signerKey,
            signerKeyPassphrase: certificates.signerKeyPassphrase,
            wwdr: certificates.wwdr,
        },
        {
            description: `${cardData.name} Loyalty Card`,
            serialNumber: cardData.barcode || `${Date.now()}`,
            passTypeIdentifier: 'pass.sk.polan.alex.control-center',
            teamIdentifier: 'AS5BHHK5AW',
            organizationName: cardData.name,
            foregroundColor: textColor,
            backgroundColor: bgColor,
            logoText: cardData.name,
        }
    );

    if (cardData.barcode) {
        const formatMap = {
            'CODE128': 'PKBarcodeFormatCode128',
            'CODE39': 'PKBarcodeFormatCode39',
            'CODE93': 'PKBarcodeFormatCode93',
            'EAN13': 'PKBarcodeFormatEAN13',
            'EAN8': 'PKBarcodeFormatEAN8',
            'UPC_A': 'PKBarcodeFormatPDF417',
            'UPC_E': 'PKBarcodeFormatPDF417',
            'ITF': 'PKBarcodeFormatITF14',
            'PDF417': 'PKBarcodeFormatPDF417',
            'QR_CODE': 'PKBarcodeFormatQR',
            'AZTEC': 'PKBarcodeFormatAztec',
            'DATA_MATRIX': 'PKBarcodeFormatPDF417',
            'CODABAR': 'PKBarcodeFormatCode128',
        };

        const appleFormat = formatMap[cardData.barcodeFormat] || 'PKBarcodeFormatCode128';

        pass.setBarcodes({
            message: cardData.barcode,
            format: appleFormat,
            messageEncoding: 'iso-8859-1',
        });
    }

    pass.type = 'storeCard';

    if (cardData.memberNumber) {
        pass.primaryFields.push({
            key: 'member',
            label: 'Card Number',//Member Number
            value: cardData.memberNumber,
            textAlignment: 'PKTextAlignmentLeft',
        });
    }

    if (cardData.cardNumber) {
        pass.secondaryFields.push({
            key: 'cardNumber',
            label: 'Company',// Card Number
            value: cardData.cardNumber,
            textAlignment: 'PKTextAlignmentLeft',
        });
    }

    pass.auxiliaryFields.push({
        key: 'cardType',
        label: 'Card Type',
        value: 'Loyalty Card',
        textAlignment: 'PKTextAlignmentLeft',
    });

    pass.backFields.push(
        {
            key: 'terms',
            label: 'Terms & Conditions',
            value: `This is your ${cardData.name} loyalty card. Present this card at checkout to earn and redeem rewards.`,
            textAlignment: 'PKTextAlignmentLeft',
        },
        {
            key: 'cardInfo',
            label: 'Card Information',
            value: `Card Number: ${cardData.cardNumber || 'N/A'}\nMember Number: ${cardData.memberNumber || 'N/A'}`,
            textAlignment: 'PKTextAlignmentLeft',
        },
        {
            key: 'support',
            label: 'Customer Support',
            value: `For assistance, please visit ${cardData.name} customer service.`,
            textAlignment: 'PKTextAlignmentLeft',
        }
    );

    console.log('Returning pass buffer');
    return pass.getAsBuffer();
}

app.post('/generate-pass', async (req, res) => {
    try {
        const cardData = req.body;

        if (!cardData.name) {
            return res.status(400).json({
                error: 'Missing required field',
                message: 'Card name is required'
            });
        }

        const passBuffer = await generatePass(cardData);
        const filename = `${cardData.name.replace(/[^a-z0-9]/gi, '_')}_loyalty_card.pkpass`;

        res.set({
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename=${filename}`,
        });

        res.send(passBuffer);
    } catch (error) {
        console.error('Error generating pass:', error);
        res.status(500).json({
            error: 'Failed to generate pass',
            message: error.message
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/companies', (req, res) => {
    try {
        const companies = loadCompanies();
        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to load companies' });
    }
});

app.get('/companies/:id', (req, res) => {
    try {
        const companies = loadCompanies();
        const company = companies.find(c => c.id === parseInt(req.params.id));

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json(company);
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ error: 'Failed to load company' });
    }
});

app.get('/logo/:domain', async (req, res) => {
    try {
        const domain = req.params.domain;
        const localLogoPath = join(__dirname, 'logos', `${domain.replace(/\./g, '_')}.png`);

        if (existsSync(localLogoPath)) {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            return res.sendFile(localLogoPath);
        }

        const logoBuffer = await fetchBrandLogo(domain);

        if (logoBuffer) {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(logoBuffer);
        }

        res.status(404).json({ error: 'Logo not found' });
    } catch (error) {
        console.error('Error fetching logo:', error);
        res.status(500).json({ error: 'Failed to fetch logo' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Passkit Express Server running on port ${PORT}`);
    console.log(`📱 Generate pass at: POST http://localhost:${PORT}/generate-pass`);
    console.log(`❤️  Health check at: http://localhost:${PORT}/health`);
    console.log(`🏢 Companies at: http://localhost:${PORT}/companies`);
    console.log(`🖼️  Logos at: http://localhost:${PORT}/logo/:domain`);
    console.log(`\n📝 Expected POST body format:`);
    console.log(`{
  "name": "Store Name",
  "logo": "example.com",
  "bgColor": "rgb(255, 0, 0)",
  "textColor": "rgb(255, 255, 255)",
  "barcode": "1234567890",
  "cardNumber": "123 456 789",
  "memberNumber": "123 456 7890"
}`);
});
