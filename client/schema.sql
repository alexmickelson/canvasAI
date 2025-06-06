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
  sis_import_id BIGINT,
  name TEXT,
  course_code TEXT,
  original_name TEXT,
  workflow_state TEXT,
  account_id BIGINT,
  root_account_id BIGINT,
  term_id BIGINT REFERENCES terms(id),
  grading_periods JSONB,
  grading_standard_id BIGINT,
  grade_passback_setting TEXT,
  created_at TIMESTAMP,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  locale TEXT,
  enrollments JSONB,
  total_students BIGINT,
  calendar JSONB,
  default_view TEXT,
  syllabus_body TEXT,
  needs_grading_count BIGINT,
  term JSONB,
  course_progress JSONB,
  apply_assignment_group_weights BOOLEAN,
  permissions JSONB,
  is_public BOOLEAN,
  is_public_to_auth_users BOOLEAN,
  public_syllabus BOOLEAN,
  public_syllabus_to_auth BOOLEAN,
  public_description TEXT,
  storage_quota_mb BIGINT,
  storage_quota_used_mb BIGINT,
  hide_final_grades BOOLEAN,
  license TEXT,
  allow_student_assignment_edits BOOLEAN,
  allow_wiki_comments BOOLEAN,
  allow_student_forum_attachments BOOLEAN,
  open_enrollment BOOLEAN,
  self_enrollment BOOLEAN,
  restrict_enrollments_to_course_dates BOOLEAN,
  course_format TEXT,
  access_restricted_by_date BOOLEAN,
  time_zone TEXT,
  blueprint BOOLEAN,
  blueprint_restrictions JSONB,
  blueprint_restrictions_by_object_type JSONB,
  template BOOLEAN,
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