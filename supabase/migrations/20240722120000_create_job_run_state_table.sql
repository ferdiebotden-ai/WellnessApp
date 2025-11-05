CREATE TABLE IF NOT EXISTS job_run_state (
  job_name TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_job_run_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_job_run_state_updated_at ON job_run_state;
CREATE TRIGGER set_job_run_state_updated_at
BEFORE INSERT OR UPDATE ON job_run_state
FOR EACH ROW
EXECUTE FUNCTION set_job_run_state_updated_at();
