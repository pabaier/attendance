--POSTGRES
CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	email VARCHAR (50) UNIQUE,
	first_name VARCHAR (50),
	last_name VARCHAR (50),
	roles TEXT,
	groups TEXT
);
CREATE INDEX users_email_idx ON users (email);

CREATE TABLE attendance (
	user_id integer REFERENCES users (id),
	date_created timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX attendance_user_id_idx ON attendance (user_id);
CREATE INDEX attendance_date_created_idx ON attendance (date_created);

CREATE TABLE courses (
	id SERIAL PRIMARY KEY,
	course_number INTEGER,
	semester VARCHAR (6),
	course_year INTEGER,
	start_time VARCHAR (5) NOT NULL,
	end_time VARCHAR (5) NOT NULL,
	UNIQUE (course_number, course_year, semester, start_time)
);
CREATE INDEX courses_course_number_idx ON courses (course_number);

insert into courses (course_number, semester, course_year, start_time, end_time)
values (220, 'Fall', 2022, '9:30', '10:30')

CREATE TABLE user_group (
	user_id integer REFERENCES users (id) ON DELETE CASCADE,
	group_name VARCHAR (50),
	UNIQUE(user_id, group_name)
);
CREATE INDEX user_group_user_id_idx ON user_group (user_id);
CREATE INDEX user_group_group_name_idx ON user_group (group_name);
