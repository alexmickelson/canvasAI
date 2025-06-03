DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

CREATE TABLE courses (
  id BIGINT PRIMARY KEY,
  name TEXT,
  original_record JSONB
);

CREATE TABLE assignments (
  id BIGINT PRIMARY KEY,
  name TEXT,
  course_id BIGINT REFERENCES courses(id),
  original_record JSONB
);

CREATE TABLE submissions (
  id BIGINT PRIMARY KEY,
  assignment_id BIGINT REFERENCES assignments(id),
  original_record JSONB
);