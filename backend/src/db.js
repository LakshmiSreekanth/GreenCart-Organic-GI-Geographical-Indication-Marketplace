const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "greencart.sqlite");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

let db;

function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function rowToObject(columns, values) {
  const obj = {};
  columns.forEach((col, i) => {
    obj[col] = values[i];
  });
  return obj;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(rowToObject(stmt.getColumnNames(), stmt.get()));
  }
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  const res = db.exec("SELECT last_insert_rowid() AS id");
  const lastInsertRowid = res.length > 0 && res[0].values.length > 0 ? res[0].values[0][0] : 0;
  const changes = db.getRowsModified();
  persist();
  return { lastInsertRowid, changes };
}

async function initDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, "..", "node_modules", "sql.js", "dist", file),
  });
  if (fs.existsSync(DB_PATH)) {
    const file = fs.readFileSync(DB_PATH);
    db = new SQL.Database(file);
  } else {
    db = new SQL.Database();
  }
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);
  persist();
  return { all, get, run, persist };
}

module.exports = { initDb, all, get, run, persist, DB_PATH };
