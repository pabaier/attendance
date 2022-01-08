CREATE TABLE user (
  id INTEGER PRIMARY KEY autoincrement,
  first_name text,
  last_name text,
  email text
);

CREATE UNIQUE INDEX user_email ON user(email);
CREATE UNIQUE INDEX user_section ON user(section);

CREATE TABLE course (
  id INTEGER PRIMARY KEY autoincrement,
  name text,
  number int,
  subject text,
  section int
);

CREATE TABLE user_course (
  user_id int,
  course_id int,
  semester int,
  FOREIGN KEY(user_id) REFERENCES user(id),
  FOREIGN KEY(course_id) REFERENCES course(id),
  UNIQUE(user_id, course_id, semester)
);

CREATE TABLE user_access (
  user_id int,
  access_type text,
  FOREIGN KEY(user_id) REFERENCES user(id)
);


CREATE TABLE attendance (
  user_id int,
  comment text,
  date_created DATETIME DEFAULT (DATETIME('now')),
  FOREIGN KEY(user_id) REFERENCES user(id)
);

CREATE INDEX attendance_date ON attendance(date_created);

CREATE TABLE code (
  code text,
  date_created DATETIME DEFAULT (DATETIME('now'))
);

--POSTGRES
CREATE TABLE public.attendance (
	user_name varchar NOT NULL,
	date_created timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.code (
	value varchar NOT NULL,
	date_created timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);


