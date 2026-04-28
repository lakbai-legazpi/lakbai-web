import dotenv from 'dotenv';
import { PrismaClient } from '../lib/generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const BUDGET_FILE = 'POI-Legazpi - Budget.csv';

loadEnvironmentVariables();

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL is not set.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type BudgetCsvRow = {
    poiId?: string;
    poiName?: string;
    budget?: string;
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

async function seedPoiBudgets(): Promise<void> {
    console.log(`Updating POI price levels from ${BUDGET_FILE}...`);

    const rows = await readCsvRows<BudgetCsvRow>(BUDGET_FILE);

    if (rows.length === 0) {
        console.warn('Budget CSV has no rows to process.');
        return;
    }

    let updated = 0;
    let skippedInvalidRows = 0;
    let notFound = 0;

    for (const [index, row] of rows.entries()) {
        const poiId = normalizeNullableCell(row.poiId);
        const budgetRaw = normalizeNullableCell(row.budget);

        if (!poiId || !budgetRaw) {
            skippedInvalidRows += 1;
            console.warn(`POI budget: skipping row ${index + 2} due to missing poiId or budget.`);
            continue;
        }

        const budgetLevel = Number.parseInt(budgetRaw, 10);
        if (Number.isNaN(budgetLevel) || budgetLevel < 1 || budgetLevel > 4) {
            skippedInvalidRows += 1;
            console.warn(`POI budget: row ${index + 2} has invalid budget value "${budgetRaw}".`);
            continue;
        }

        try {
            await prisma.pOI.update({
                where: { id: poiId },
                data: { priceLevel: budgetLevel },
            });
            updated += 1;
        } catch (error) {
            if (isRecordNotFoundError(error)) {
                notFound += 1;
                console.warn(`POI budget: row ${index + 2} references missing POI id ${poiId}.`);
                continue;
            }

            throw error;
        }
    }

    console.log(
        `POI budgets done. Updated: ${updated}, Missing POIs: ${notFound}, Skipped invalid rows: ${skippedInvalidRows}`
    );
}

async function main(): Promise<void> {
    console.log('Starting seed import for POI budgets...');

    await seedPoiBudgets();

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
