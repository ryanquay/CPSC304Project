import { readFileSync } from "fs";

// takes .sql file and returns array of statements from the file
export function parseSQL(filepath: string): string[] {
    const raw = readFileSync(filepath, 'utf8');
    const no_comments = raw.replace(/--.*?\n/g, '');
    const no_newlines = no_comments.replace(/(\r\n|\n|\r)/gm, "");
    const statements = no_newlines.split(';').filter(s => s.trim().length > 0);
    return statements;
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}