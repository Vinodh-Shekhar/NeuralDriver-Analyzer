/*
  # Add FrameView Metadata Columns

  1. Modified Tables
    - `telemetry_sessions`
      - `gpu_name` (text) - GPU model detected from FrameView CSV (e.g., "NVIDIA GeForce RTX 5080")
      - `cpu_name` (text) - CPU model detected from FrameView CSV (e.g., "AMD Ryzen 9 9950X3D")
      - `resolution` (text) - Render resolution detected from FrameView CSV (e.g., "3840x2160")
      - `application` (text) - Application/game name detected from FrameView CSV (e.g., "bf6.exe")
      - `csv_source` (text) - Source format of the uploaded CSV ("frameview" or "generic")

  2. Notes
    - All new columns default to empty string so existing data is unaffected
    - Columns are optional metadata enrichment from Nvidia FrameView CSV exports
    - No security changes needed as existing RLS policies cover all columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telemetry_sessions' AND column_name = 'gpu_name'
  ) THEN
    ALTER TABLE telemetry_sessions ADD COLUMN gpu_name text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telemetry_sessions' AND column_name = 'cpu_name'
  ) THEN
    ALTER TABLE telemetry_sessions ADD COLUMN cpu_name text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telemetry_sessions' AND column_name = 'resolution'
  ) THEN
    ALTER TABLE telemetry_sessions ADD COLUMN resolution text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telemetry_sessions' AND column_name = 'application'
  ) THEN
    ALTER TABLE telemetry_sessions ADD COLUMN application text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telemetry_sessions' AND column_name = 'csv_source'
  ) THEN
    ALTER TABLE telemetry_sessions ADD COLUMN csv_source text NOT NULL DEFAULT 'generic';
  END IF;
END $$;
