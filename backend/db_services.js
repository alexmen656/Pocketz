// I must admit a good part of this was AI lol

import pool from './db.js';
//import fs from 'fs';
//import path from 'path';
import { fileURLToPath } from 'url';

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

/*export async function initializeTables() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
            await pool.query(statement);
        }

        console.log('✓ Tabellen erfolgreich initialisiert');
    } catch (error) {
        console.error('✗ Fehler beim Initialisieren der Tabellen:', error.message);
        throw error;
    }
}*/

export async function getOrCreateCountry(countryName, countryCode = null) {
    try {
        const result = await pool.query(
            'SELECT id FROM countries WHERE name = $1',
            [countryName]
        );

        if (result.rows.length > 0) {
            return result.rows[0].id;
        }

        const insertResult = await pool.query(
            'INSERT INTO countries (name, code) VALUES ($1, $2) RETURNING id',
            [countryName, countryCode]
        );

        return insertResult.rows[0].id;
    } catch (error) {
        console.error(`✗ Fehler beim Erstellen des Landes ${countryName}:`, error.message);
        throw error;
    }
}

export async function getAllCountries() {
    try {
        const result = await pool.query('SELECT * FROM countries ORDER BY name');
        return result.rows;
    } catch (error) {
        console.error('✗ Fehler beim Abrufen der Länder:', error.message);
        throw error;
    }
}

export async function addCompany(country, companyData) {
    try {
        const countryId = await getOrCreateCountry(country);
        const { name, category, hauptteilnehmer, logo, bg_color, text_color } = companyData;

        const result = await pool.query(
            `INSERT INTO companies 
            (country_id, name, category, hauptteilnehmer, logo, bg_color, text_color) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [countryId, name, category || null, hauptteilnehmer || null, logo || null, bg_color || null, text_color || null]
        );

        console.log(`✓ Unternehmen "${name}" für ${country} hinzugefügt`);
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') {
            console.warn(`⚠ Unternehmen "${companyData.name}" existiert bereits für ${country}`);
            return await getCompanyByName(country, companyData.name);
        }
        console.error('✗ Fehler beim Hinzufügen des Unternehmens:', error.message);
        throw error;
    }
}

export async function addCompaniesForCountry(country, companies) {
    try {
        const countryId = await getOrCreateCountry(country);
        let addedCount = 0;
        let skippedCount = 0;

        for (const company of companies) {
            try {
                const { company_name, category, hauptteilnehmer, logo, bg_color, text_color } = company;

                await pool.query(
                    `INSERT INTO companies 
                    (country_id, name, category, hauptteilnehmer, logo, bg_color, text_color) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7) 
                    ON CONFLICT (country_id, name) DO NOTHING`,
                    [countryId, company_name, category || null, hauptteilnehmer || null, logo || null, bg_color || null, text_color || null]
                );

                addedCount++;
            } catch (error) {
                console.warn(`⚠ Fehler beim Hinzufügen von "${company.company_name}" für ${country}:`, error.message);
                skippedCount++;
            }
        }

        console.log(`✓ ${addedCount} Unternehmen für ${country} hinzugefügt, ${skippedCount} übersprungen`);
        return { addedCount, skippedCount, country };
    } catch (error) {
        console.error(`✗ Fehler beim Batch-Import für ${country}:`, error.message);
        throw error;
    }
}

export async function getCompaniesByCountry(country) {
    try {
        const result = await pool.query(
            `SELECT c.* FROM companies c
             JOIN countries co ON c.country_id = co.id
             WHERE co.name = $1
             ORDER BY c.name`,
            [country]
        );
        return result.rows;
    } catch (error) {
        console.error(`✗ Fehler beim Abrufen der Unternehmen für ${country}:`, error.message);
        throw error;
    }
}

export async function getCompanyByName(country, companyName) {
    try {
        const result = await pool.query(
            `SELECT c.* FROM companies c
             JOIN countries co ON c.country_id = co.id
             WHERE co.name = $1 AND c.name = $2`,
            [country, companyName]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error(`✗ Fehler beim Abrufen des Unternehmens:`, error.message);
        throw error;
    }
}

export async function getCompanyById(id) {
    try {
        const result = await pool.query(
            'SELECT * FROM companies WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error(`✗ Fehler beim Abrufen des Unternehmens (ID: ${id}):`, error.message);
        throw error;
    }
}

export async function updateCompany(id, updateData) {
    try {
        const { name, category, hauptteilnehmer, logo, bg_color, text_color } = updateData;

        const result = await pool.query(
            `UPDATE companies 
             SET name = COALESCE($1, name),
                 category = COALESCE($2, category),
                 hauptteilnehmer = COALESCE($3, hauptteilnehmer),
                 logo = COALESCE($4, logo),
                 bg_color = COALESCE($5, bg_color),
                 text_color = COALESCE($6, text_color),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [name, category, hauptteilnehmer, logo, bg_color, text_color, id]
        );

        if (result.rows.length === 0) {
            throw new Error(`Unternehmen mit ID ${id} nicht gefunden`);
        }

        console.log(`✓ Unternehmen "${result.rows[0].name}" aktualisiert`);
        return result.rows[0];
    } catch (error) {
        console.error('✗ Fehler beim Aktualisieren des Unternehmens:', error.message);
        throw error;
    }
}

export async function deleteCompany(id) {
    try {
        const company = await getCompanyById(id);
        if (!company) {
            throw new Error(`Unternehmen mit ID ${id} nicht gefunden`);
        }

        await pool.query('DELETE FROM companies WHERE id = $1', [id]);

        console.log(`✓ Unternehmen "${company.name}" gelöscht`);
        return { success: true, deleted: company };
    } catch (error) {
        console.error('✗ Fehler beim Löschen des Unternehmens:', error.message);
        throw error;
    }
}

export async function deleteCompaniesByCountry(country) {
    try {
        const companies = await getCompaniesByCountry(country);

        await pool.query(
            `DELETE FROM companies WHERE country_id = 
             (SELECT id FROM countries WHERE name = $1)`,
            [country]
        );

        console.log(`✓ ${companies.length} Unternehmen für ${country} gelöscht`);
        return { success: true, deleted: companies.length };
    } catch (error) {
        console.error(`✗ Fehler beim Löschen der Unternehmen für ${country}:`, error.message);
        throw error;
    }
}

export async function searchCompanies(searchTerm) {
    try {
        const result = await pool.query(
            `SELECT c.*, co.name as country FROM companies c
             JOIN countries co ON c.country_id = co.id
             WHERE LOWER(c.name) LIKE LOWER($1)
             ORDER BY c.name`,
            [`%${searchTerm}%`]
        );
        return result.rows;
    } catch (error) {
        console.error('✗ Fehler beim Suchen von Unternehmen:', error.message);
        throw error;
    }
}

export async function getCompaniesByCategory(category) {
    try {
        const result = await pool.query(
            `SELECT c.*, co.name as country FROM companies c
             JOIN countries co ON c.country_id = co.id
             WHERE c.category = $1
             ORDER BY co.name, c.name`,
            [category]
        );
        return result.rows;
    } catch (error) {
        console.error(`✗ Fehler beim Abrufen der Unternehmen in Kategorie ${category}:`, error.message);
        throw error;
    }
}

export async function getStatistics() {
    try {
        const countResult = await pool.query(
            `SELECT COUNT(*) as total_companies, COUNT(DISTINCT country_id) as total_countries FROM companies`
        );

        const categoriesResult = await pool.query(
            `SELECT category, COUNT(*) as count FROM companies 
             WHERE category IS NOT NULL
             GROUP BY category
             ORDER BY count DESC`
        );

        return {
            total_companies: parseInt(countResult.rows[0].total_companies),
            total_countries: parseInt(countResult.rows[0].total_countries),
            by_category: categoriesResult.rows
        };
    } catch (error) {
        console.error('✗ Fehler beim Abrufen der Statistiken:', error.message);
        throw error;
    }
}