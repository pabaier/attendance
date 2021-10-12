CREATE TABLE users (
  id INTEGER PRIMARY KEY autoincrement,
  first_name text,
  last_name text,
  email text
);

CREATE UNIQUE INDEX users_email ON users(email);
CREATE UNIQUE INDEX users_section ON users(section);

CREATE TABLE user_class (
  user_id int,
  class_id text,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE user_access (
  user_id int,
  access_type text,
  FOREIGN KEY(user_id) REFERENCES users(id)
);


CREATE TABLE attendance (
  user_id int,
  comment text,
  date_created DATETIME DEFAULT (DATETIME('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX attendance_date ON attendance(date_created);

CREATE TABLE code (
  code text,
  date_created DATETIME DEFAULT (DATETIME('now'))
);

