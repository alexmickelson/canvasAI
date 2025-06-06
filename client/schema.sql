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
  name TEXT,
  term_id BIGINT REFERENCES terms(id),
  original_record JSONB
);

-- Updated assignments table to include all fields from CanvasAssignment
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
  user_id BIGINT,
  assignment_id BIGINT REFERENCES assignments(id),
  original_record JSONB
);

CREATE TABLE modules (
  id BIGINT PRIMARY KEY,
  name TEXT,
  course_id BIGINT REFERENCES courses(id),
  original_record JSONB
);