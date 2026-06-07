CREATE TABLE IF NOT EXISTS Reports (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) >= 3),
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'InProgress', 'Resolved', 'Closed')),
  description TEXT NOT NULL CHECK (length(description) >= 10),
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE RESTRICT
);
