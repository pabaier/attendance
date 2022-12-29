--POSTGRES
CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	email VARCHAR (50) UNIQUE,
	first_name VARCHAR (50),
	last_name VARCHAR (50),
	password_hash VARCHAR (64),
	salt VARCHAR (32),
	roles TEXT
);
CREATE INDEX users_email_idx ON users (email);

CREATE TABLE groups (
	id SERIAL PRIMARY KEY,
	group_name VARCHAR (50)
);

CREATE TABLE semester (
	id SERIAL PRIMARY KEY,
	season VARCHAR (6),
	semester_year INTEGER,
	UNIQUE (season, semester_year)
);

CREATE TABLE courses (
	id SERIAL PRIMARY KEY,
	course_name VARCHAR (50),
	course_number VARCHAR(6),
	semester_id integer REFERENCES semester (id) NOT NULL,
	start_time VARCHAR (5) NOT NULL,
	end_time VARCHAR (5) NOT NULL,
	group_id integer REFERENCES groups (id) NOT NULL,
	UNIQUE (course_number, semester_id, start_time)
);
CREATE INDEX courses_course_number_idx ON courses (course_number);

CREATE TABLE attendance (
	user_id integer REFERENCES users (id),
	course_id integer REFERENCES courses (id),
	ip VARCHAR(51),
	date_created timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX attendance_user_id_idx ON attendance (user_id);
CREATE INDEX attendance_date_created_idx ON attendance (date_created);
CREATE INDEX attendance_user_id_course_id_idx ON attendance (user_id, course_id);

CREATE TABLE user_group (
	user_id integer REFERENCES users (id) ON DELETE CASCADE NOT NULL,
	group_id integer REFERENCES groups (id) ON DELETE CASCADE NOT NULL,
	UNIQUE(user_id, group_id)
);
CREATE INDEX user_group_user_id_idx ON user_group (user_id);
CREATE INDEX user_group_group_id_idx ON user_group (group_id);


CREATE TABLE course_dates (
	course_id integer REFERENCES courses (id) ON DELETE CASCADE,
	meeting timestamptz NOT NULL
);
CREATE INDEX course_dates_course_id_idx ON course_dates (course_id);

CREATE TABLE posts (
	id SERIAL PRIMARY KEY,	
	title VARCHAR (50),
	body TEXT,
	url_link TEXT
);

CREATE TABLE post_types (
	id SERIAL PRIMARY KEY,	
	post_type VARCHAR (50)
);
INSERT INTO post_types(post_type)
VALUES ("announcement"), ("assignment"), ("pinned announcement");

CREATE TABLE post_group (
	post_id integer REFERENCES posts (id) ON DELETE CASCADE,
	group_id integer REFERENCES groups (id) ON DELETE CASCADE,
	open_time timestamptz,
	close_time timestamptz,
	active_start_time timestamptz,
	active_end_time timestamptz,
	post_type_id integer REFERENCES post_types (id) ON DELETE CASCADE,
	PRIMARY KEY(post_id, group_id, post_type_id)
);
CREATE INDEX post_group_group_id_post_type_id_idx ON post_group (group_id, post_type_id);

CREATE TABLE test_questions (
	id SERIAL PRIMARY KEY,
	group_id INTEGER REFERENCES groups (id) ON DELETE CASCADE,
	test_date timestamptz,
	question_name VARCHAR (50),
	question_page INTEGER,
	ordinal INTEGER,
	points INTEGER,
	question_weight INTEGER,
	UNIQUE (group_id, test_date, question_name),
	UNIQUE (group_id, test_date, ordinal)
);
CREATE INDEX test_questions_group_id_test_date_idx ON test_questions (group_id, test_date);
CREATE INDEX test_questions_ordinal_idx ON test_questions (ordinal);

CREATE TABLE user_test (
	user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
	test_date timestamptz,
	grade DECIMAL,
	url_link TEXT
);

CREATE TABLE user_question_grades (
	id SERIAL PRIMARY KEY,
	user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
	question_id INTEGER REFERENCES test_questions (id) ON DELETE CASCADE,
	grade DECIMAL,
	UNIQUE (user_id, question_id)	
);
CREATE INDEX user_question_grades_user_id_idx ON user_question_grades (user_id);
CREATE INDEX user_question_grades_question_id_idx ON user_question_grades (question_id);
CREATE INDEX user_question_grades_user_id_question_id_idx ON user_question_grades (user_id, question_id);

CREATE TABLE user_settings (
	user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
	semester_id INTEGER REFERENCES semester (id) ON DELETE CASCADE,
	UNIQUE (user_id)
);