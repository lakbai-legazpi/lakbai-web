import dotenv from 'dotenv';
import { PrismaClient } from '../lib/generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const CONTACTS_AND_DESC_FILE = 'POI-Legazpi - ContactsANDDescp.csv';
const WEBSITES_FILE = 'POI-Legazpi - Website.csv';

loadEnvironmentVariables();

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL is not set.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type ContactsAndDescCsvRow = {
    id?: string;
    phoneNumber?: string;
    email?: string;
    Description?: string;
};

type WebsiteCsvRow = {
    poiId?: string;
    label?: string;
    url?: string;
};

type NotFoundError = {
    code?: string;
};

function loadEnvironmentVariables(): void {
    const candidates = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '..', '.env'),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            dotenv.config({ path: candidate, override: false });
        }
    }
}

function resolveCsvPath(fileName: string): string {
    const candidates = [
        path.resolve(process.cwd(), fileName),
        path.resolve(process.cwd(), '..', fileName),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error(
        `Could not find ${fileName}. Checked: ${candidates.join(', ')}`
    );
}

async function readCsvRows<T>(fileName: string): Promise<T[]> {
    const csvPath = resolveCsvPath(fileName);
    const fileContent = await fs.promises.readFile(csvPath, { encoding: 'utf-8' });

    return parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        trim: true,
        bom: true,
    }) as T[];
}

function normalizeNullableCell(value: string | undefined): string | null {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function isRecordNotFoundError(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        (error as NotFoundError).code === 'P2025'
    );
}

async function seedContactsAndDescriptions(): Promise<void> {
    console.log(`Updating POI contact and description fields from ${CONTACTS_AND_DESC_FILE}...`);

    const rows = await readCsvRows<ContactsAndDescCsvRow>(CONTACTS_AND_DESC_FILE);

    if (rows.length === 0) {
        console.warn('Contacts/description CSV has no rows to process.');
        return;
    }

    let updated = 0;
    let skippedInvalidRows = 0;
    let notFound = 0;

    for (const [index, row] of rows.entries()) {
        const poiId = normalizeNullableCell(row.id);

        if (!poiId) {
            skippedInvalidRows += 1;
            console.warn(`POI contacts: skipping row ${index + 2} due to missing id.`);
            continue;
        }

        const phoneNumber = normalizeNullableCell(row.phoneNumber);
        const email = normalizeNullableCell(row.email);
        const description = normalizeNullableCell(row.Description);

        const data: {
            phoneNumber: string | null;
            email: string | null;
            description?: string;
        } = {
            phoneNumber,
            email,
        };

        if (description !== null) {
            data.description = description;
        }

        try {
            await prisma.pOI.update({
                where: { id: poiId },
                data,
            });
            updated += 1;
        } catch (error) {
            if (isRecordNotFoundError(error)) {
                notFound += 1;
                console.warn(`POI contacts: row ${index + 2} references missing POI id ${poiId}.`);
                continue;
            }

            throw error;
        }
    }

    console.log(
        `POI contacts/descriptions done. Updated: ${updated}, Missing POIs: ${notFound}, Skipped invalid rows: ${skippedInvalidRows}`
    );
}

async function seedPoiLinks(): Promise<void> {
    console.log(`Inserting POI links from ${WEBSITES_FILE}...`);

    const rows = await readCsvRows<WebsiteCsvRow>(WEBSITES_FILE);

    if (rows.length === 0) {
        console.warn('Website CSV has no rows to process.');
        return;
    }

    const normalizedRows = rows
        .map((row, index) => ({
            rowNumber: index + 2,
            poiId: normalizeNullableCell(row.poiId),
            label: normalizeNullableCell(row.label),
            url: normalizeNullableCell(row.url),
        }));

    let skippedInvalidRows = 0;
    const validRows: Array<{ poiId: string; label: string; url: string }> = [];

    for (const row of normalizedRows) {
        if (!row.poiId || !row.label || !row.url) {
            skippedInvalidRows += 1;
            continue;
        }

        validRows.push({
            poiId: row.poiId,
            label: row.label,
            url: row.url,
        });
    }

    if (validRows.length === 0) {
        console.warn('No valid website rows found after cleanup.');
        return;
    }

    const poiIds = Array.from(new Set(validRows.map((row) => row.poiId)));
    const existingPois = await prisma.pOI.findMany({
        where: {
            id: {
                in: poiIds,
            },
        },
        select: {
            id: true,
        },
    });

    const existingPoiIds = new Set(existingPois.map((poi) => poi.id));

    const existingLinks = await prisma.pOILink.findMany({
        where: {
            poiId: {
                in: Array.from(existingPoiIds),
            },
        },
        select: {
            poiId: true,
            label: true,
            url: true,
        },
    });

    const existingKeys = new Set(
        existingLinks.map((link) => `${link.poiId}::${link.label}::${link.url}`)
    );

    const seenKeys = new Set<string>();
    const createData: Array<{ poiId: string; label: string; url: string }> = [];
    let skippedMissingPois = 0;

    for (const row of validRows) {
        if (!existingPoiIds.has(row.poiId)) {
            skippedMissingPois += 1;
            continue;
        }

        const key = `${row.poiId}::${row.label}::${row.url}`;
        if (existingKeys.has(key) || seenKeys.has(key)) {
            continue;
        }

        seenKeys.add(key);
        createData.push(row);
    }

    let created = 0;
    if (createData.length > 0) {
        const result = await prisma.pOILink.createMany({
            data: createData,
        });
        created = result.count;
    }

    console.log(
        `POI links done. Created: ${created}, Skipped invalid rows: ${skippedInvalidRows}, Skipped missing POIs: ${skippedMissingPois}`
    );
}

async function main(): Promise<void> {
    console.log('Starting seed import for contacts/descriptions and POI links...');

    await seedContactsAndDescriptions();
    await seedPoiLinks();

    console.log('Seed import completed successfully.');
}

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
