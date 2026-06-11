import { prisma } from '../utils/prisma';
import { DEFAULT_SETTINGS } from '../constants/settings';

/** Materialize missing defaults without ever overwriting persisted settings. */
export async function ensureDefaultSettings(): Promise<void> {
  await prisma.$transaction(
    Object.entries(DEFAULT_SETTINGS).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: {},
        create: { key, value },
      }),
    ),
  );
}

/** Returns defaults overlaid with any values stored in the database. */
export async function getMergedSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const fromDb = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...fromDb };
}

/** Upserts the provided key/value pairs and returns the merged settings. */
export async function updateSettings(updates: Record<string, unknown>): Promise<Record<string, string>> {
  const entries = Object.entries(updates).filter(([key]) => typeof key === 'string' && key.length > 0);

  await Promise.all(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value ?? '') },
        create: { key, value: String(value ?? '') },
      }),
    ),
  );

  return getMergedSettings();
}
