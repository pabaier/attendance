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
INSERT INTO users(email, first_name, last_name, password_hash, salt, roles)
VALUES ('baierpa@cofc.edu', 'p', 'b', 'hQl45siunpPrG8qefHw7hNl4h11kgv/ut5tg4+uqCzw=', 'pQtxLEpjEbtK+OESLsCTFw==', 'admin');

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
INSERT INTO semester(season, semester_year)
VALUES ('Spring', 2023);


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
VALUES ('announcement'), ('assignment'), ('pinned announcement');

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

CREATE TABLE user_settings (
	user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
	semester_id INTEGER REFERENCES semester (id) ON DELETE CASCADE,
	UNIQUE (user_id)
);
INSERT INTO user_settings(user_id, semester_id)
VALUES (1, 1);


CREATE TABLE assessment (
	id SERIAL PRIMARY KEY,
    slug UUID DEFAULT gen_random_uuid (),
  	assessment_name VARCHAR(50),
	assessment_description TEXT,
	UNIQUE(slug)
);
CREATE INDEX assessment_slug_idx ON assessment (slug);

CREATE TABLE question (
	id SERIAL PRIMARY KEY,
	title VARCHAR(50),
	question_description TEXT
);

CREATE TABLE assessment_settings (
	assessment_id INTEGER REFERENCES assessment (id) ON DELETE CASCADE,
	group_id INTEGER REFERENCES groups (id) ON DELETE CASCADE,
	start_time timestamptz,
	end_time timestamptz,
	PRIMARY KEY(assessment_id, group_id)
);

CREATE TABLE assessment_question (
	assessment_id INTEGER REFERENCES assessment (id) ON DELETE CASCADE,
	question_id INTEGER REFERENCES question (id) ON DELETE CASCADE,
	ordinal INTEGER,
	attempts INTEGER,
	UNIQUE(assessment_id, ordinal)
);
CREATE INDEX assessment_question_assessment_id_idx ON assessment_question (assessment_id);

CREATE TABLE user_question (
	assessment_id INTEGER REFERENCES assessment (id) ON DELETE CASCADE,
	question_id INTEGER REFERENCES question (id) ON DELETE CASCADE,
	user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
	user_answer TEXT,
	variables TEXT,
	question_answer TEXT,
	code TEXT,
	attempts INTEGER,
	PRIMARY KEY(assessment_id, question_id, user_id)
);

CREATE TABLE user_assessment (
	user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
	assessment_id INTEGER REFERENCES assessment (id) ON DELETE CASCADE,
	grade VARCHAR(5),
	comment TEXT,
	start_time timestamptz,
	end_time timestamptz,
	PRIMARY KEY(user_id, assessment_id)
);
CREATE INDEX user_assessment_assessment_id_email_idx ON user_assessment (assessment_id);

CREATE TABLE global_settings (
	user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
	code_refresh_rate INTEGER,
	code_time_window INTEGER,
	code_time_start INTEGER,
	UNIQUE (user_id)
);
INSERT INTO global_settings(user_id, code_refresh_rate, code_time_window, code_time_start)
VALUES (1, 2000, 10, 5);