-- psql -U $POSTGRES_USER $POSTGRES_DB

Create extension vector;
CREATE EXTENSION IF NOT EXISTS vectorscale CASCADE;

DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS module_items CASCADE;
DROP TABLE IF EXISTS terms CASCADE;
DROP TABLE IF EXISTS sync_job CASCADE;

create table sync_job (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  message TEXT
);

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
  sync_job_id BIGINT REFERENCES sync_job(id),
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
  sync_job_id BIGINT REFERENCES sync_job(id),
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
  sync_job_id BIGINT REFERENCES sync_job(id),
  original_record JSONB
);

CREATE TABLE module_items (
  id BIGINT PRIMARY KEY,
  module_id BIGINT REFERENCES modules(id),
  position INTEGER,
  title TEXT,
  indent INTEGER,
  type TEXT,
  content_id BIGINT,
  html_url TEXT,
  url TEXT,
  page_url TEXT,
  external_url TEXT,
  new_tab BOOLEAN,
  completion_requirement JSONB,
  content_details JSONB,
  published BOOLEAN,
  sync_job_id BIGINT REFERENCES sync_job(id),
  original_record JSONB
);

CREATE TABLE enrollments (
  id BIGINT PRIMARY KEY,
  course_id BIGINT REFERENCES courses(id),
  sis_course_id TEXT,
  course_integration_id TEXT,
  course_section_id BIGINT,
  section_integration_id TEXT,
  sis_account_id TEXT,
  sis_section_id TEXT,
  sis_user_id TEXT,
  enrollment_state TEXT,
  limit_privileges_to_course_section BOOLEAN,
  sis_import_id BIGINT,
  root_account_id BIGINT,
  type TEXT,
  user_id BIGINT,
  associated_user_id BIGINT,
  role TEXT,
  role_id BIGINT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  last_activity_at TIMESTAMP,
  last_attended_at TIMESTAMP,
  total_activity_time INTEGER,
  html_url TEXT,
  grades JSONB,
  "user" JSONB,
  override_grade TEXT,
  override_score NUMERIC,
  unposted_current_grade TEXT,
  unposted_final_grade TEXT,
  unposted_current_score TEXT,
  unposted_final_score TEXT,
  has_grading_periods BOOLEAN,
  totals_for_all_grading_periods_option BOOLEAN,
  current_grading_period_title TEXT,
  current_grading_period_id BIGINT,
  current_period_override_grade TEXT,
  current_period_override_score NUMERIC,
  current_period_unposted_current_score NUMERIC,
  current_period_unposted_final_score NUMERIC,
  current_period_unposted_current_grade TEXT,
  current_period_unposted_final_grade TEXT,
  sync_job_id BIGINT REFERENCES sync_job(id),
  original_record JSONB
);