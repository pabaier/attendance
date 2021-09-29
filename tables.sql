CREATE TABLE users (
  id INTEGER PRIMARY KEY autoincrement,
  first_name text,
  last_name text,
  email text,
  section smallint
);

CREATE UNIQUE INDEX users_email ON users(email);
CREATE UNIQUE INDEX users_section ON users(section);

CREATE TABLE attendance (
  user_id int,
  date_created DATETIME DEFAULT (DATETIME('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX attendance_date ON attendance(date_created);

CREATE TABLE code (
  code text,
  date_created DATETIME DEFAULT (DATETIME('now'))
);

