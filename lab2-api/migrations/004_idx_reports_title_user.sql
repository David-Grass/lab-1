CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_title_user
  ON Reports(lower(trim(title)), userId);
