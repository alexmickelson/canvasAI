-- psql -U $POSTGRES_USER $POSTGRES_DB
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS terms CASCADE;
DROP TABLE IF EXISTS modules CASCADE;

CREATE TABLE terms (
  id BIGINT PRIMARY KEY,
  name TEXT,
  original_record JSONB
);

CREATE TABLE courses (
  id BIGINT PRIMARY KEY,
  sis_course_id TEXT,
  uuid TEXT,
  integration_id TEXT,
  name TEXT,
  course_code TEXT,
  workflow_state TEXT,
  enrollment_term_id BIGINT REFERENCES terms(id),
  created_at TIMESTAMP,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  total_students INTEGER,
  default_view TEXT,
  needs_grading_count INTEGER,
  public_description TEXT,
  hide_final_grades BOOLEAN,
  original_record JSONB
);

CREATE TABLE assignments (
  id BIGINT PRIMARY KEY,
  name TEXT,
  description TEXT,
  due_date TIMESTAMP,
  unlock_at TIMESTAMP,
  lock_at TIMESTAMP,
  course_id BIGINT REFERENCES courses(id),
  html_url TEXT,
  submission_types TEXT[],
  grading_type TEXT,
  points_possible NUMERIC,
  grading_standard_id BIGINT,
  published BOOLEAN,
  muted BOOLEAN,
  context_module_id BIGINT,
  original_record JSONB
);

CREATE TABLE submissions (
  id BIGINT PRIMARY KEY,
  assignment_id BIGINT REFERENCES assignments(id),
  user_id BIGINT,
  submitted_at TIMESTAMP,
  score NUMERIC,
  grade TEXT,
  workflow_state TEXT,
  attempt BIGINT,
  late BOOLEAN,
  missing BOOLEAN,
  original_record JSONB
);

CREATE TABLE modules (
  id BIGINT PRIMARY KEY,
  name TEXT,
  position BIGINT,
  unlock_at TIMESTAMP,
  require_sequential_progress BOOLEAN,
  publish_final_grade BOOLEAN,
  published BOOLEAN,
  course_id BIGINT REFERENCES courses(id),
  original_record JSONB
);