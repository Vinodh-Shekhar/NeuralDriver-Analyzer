/*
  # Create GPU Telemetry Tables

  1. New Tables
    - `telemetry_sessions`
      - `id` (uuid, primary key)
      - `session_name` (text) - Name/label for the comparison session
      - `driver_a_name` (text) - Driver A file name
      - `driver_b_name` (text) - Driver B file name
      - `created_at` (timestamptz) - When the session was created
    - `frame_data`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key) - Links to telemetry_sessions
      - `driver_label` (text) - 'A' or 'B'
      - `frame_number` (integer) - Frame index
      - `frame_time` (float) - Frame time in milliseconds
      - `created_at` (timestamptz) - When the record was created
    - `comparison_results`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key) - Links to telemetry_sessions
      - `metrics_a` (jsonb) - Performance metrics for Driver A
      - `metrics_b` (jsonb) - Performance metrics for Driver B
      - `qa_analysis_a` (jsonb) - QA analysis for Driver A
      - `qa_analysis_b` (jsonb) - QA analysis for Driver B
      - `regression_result` (jsonb) - Regression detection result
      - `created_at` (timestamptz) - When the comparison was run

  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous access (public dashboard tool)
*/

CREATE TABLE IF NOT EXISTS telemetry_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name text NOT NULL DEFAULT '',
  driver_a_name text NOT NULL DEFAULT '',
  driver_b_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE telemetry_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read telemetry sessions"
  ON telemetry_sessions
  FOR SELECT
  TO anon
  USING (created_at > now() - interval '24 hours');

CREATE POLICY "Allow anonymous insert telemetry sessions"
  ON telemetry_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS frame_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES telemetry_sessions(id) ON DELETE CASCADE,
  driver_label text NOT NULL CHECK (driver_label IN ('A', 'B')),
  frame_number integer NOT NULL DEFAULT 0,
  frame_time float NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE frame_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read frame data"
  ON frame_data
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM telemetry_sessions
      WHERE telemetry_sessions.id = frame_data.session_id
      AND telemetry_sessions.created_at > now() - interval '24 hours'
    )
  );

CREATE POLICY "Allow anonymous insert frame data"
  ON frame_data
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM telemetry_sessions
      WHERE telemetry_sessions.id = frame_data.session_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_frame_data_session_id ON frame_data(session_id);
CREATE INDEX IF NOT EXISTS idx_frame_data_driver_label ON frame_data(session_id, driver_label);

CREATE TABLE IF NOT EXISTS comparison_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES telemetry_sessions(id) ON DELETE CASCADE,
  metrics_a jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics_b jsonb NOT NULL DEFAULT '{}'::jsonb,
  qa_analysis_a jsonb NOT NULL DEFAULT '{}'::jsonb,
  qa_analysis_b jsonb NOT NULL DEFAULT '{}'::jsonb,
  regression_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comparison_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read comparison results"
  ON comparison_results
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM telemetry_sessions
      WHERE telemetry_sessions.id = comparison_results.session_id
      AND telemetry_sessions.created_at > now() - interval '24 hours'
    )
  );

CREATE POLICY "Allow anonymous insert comparison results"
  ON comparison_results
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM telemetry_sessions
      WHERE telemetry_sessions.id = comparison_results.session_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_comparison_results_session_id ON comparison_results(session_id);
