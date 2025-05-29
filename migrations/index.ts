import { addDoc, collection, getDocs } from "firebase/firestore";
import { readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { firestore } from "./firebase/config";

const MIGRATIONS_COLLECTION = "migrations";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getAppliedMigrations() {
  const snapshot = await getDocs(collection(firestore, MIGRATIONS_COLLECTION));
  return snapshot.docs.map((doc) => doc.id);
}

async function recordMigration(filename: string) {
  await addDoc(collection(firestore, MIGRATIONS_COLLECTION), {
    filename,
    appliedAt: new Date(),
  });
}

async function runMigrations() {
  const migrationsDir = __dirname;
  const files = readdirSync(migrationsDir)
    .filter((f) => f.match(/^\d+.*\.ts$/))
    .sort();

  const applied = await getAppliedMigrations();

  for (const file of files) {
    if (applied.includes(file)) {
      console.log(`Skipping already applied migration: ${file}`);
      continue;
    }
    console.log(`Running migration: ${file}`);
    const modulePath = pathToFileURL(join(migrationsDir, file)).href;
    const migration = await import(modulePath);
    await migration.default();
    await recordMigration(file);
    console.log(`Migration applied: ${file}`);
  }
}

runMigrations()
  .then(() => {
    console.log("All migrations complete");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
