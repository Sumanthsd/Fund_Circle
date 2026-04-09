import './loadEnv.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

function resolveDbPath(inputPath) {
  if (!inputPath) {
    return path.join(backendRoot, 'data', 'chit_fund.sqlite');
  }

  return path.isAbsolute(inputPath) ? inputPath : path.resolve(backendRoot, inputPath);
}

function normalizeSql(sql) {
  return sql.replace(/\$\d+/g, '?');
}

export const dbPath = resolveDbPath(process.env.SQLITE_DB_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

sqlite3.verbose();

export const db = new sqlite3.Database(dbPath);

const databaseReady = new Promise((resolve, reject) => {
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON', (pragmaError) => {
      if (pragmaError) {
        reject(pragmaError);
        return;
      }

      resolve();
    });
  });
});

export async function runAsync(sql, params = []) {
  await databaseReady;

  return new Promise((resolve, reject) => {
    db.run(normalizeSql(sql), params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

export async function execAsync(sql) {
  await databaseReady;

  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export async function allAsync(sql, params = []) {
  await databaseReady;

  return new Promise((resolve, reject) => {
    db.all(normalizeSql(sql), params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

export async function getAsync(sql, params = []) {
  await databaseReady;

  return new Promise((resolve, reject) => {
    db.get(normalizeSql(sql), params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}
