CREATE TABLE courses (
  id INT PRIMARY KEY,
  name TEXT,
  original_record JSONB -- Column to store the original record
);

CREATE TABLE assignments (
  id INT PRIMARY KEY,
  name TEXT,
  course_id INT REFERENCES courses(id),
  original_record JSONB -- Column to store the original record
);

CREATE TABLE submissions (
  id INT PRIMARY KEY,
  user_id INT,
  assignment_id INT REFERENCES assignments(id),
  submitted_at TIMESTAMP,
  grade TEXT,
  original_record JSONB -- Column to store the original record
);