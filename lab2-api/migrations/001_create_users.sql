CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) >= 2),
  email TEXT NOT NULL UNIQUE CHECK (instr(lower(email), '@') > 0)
);
