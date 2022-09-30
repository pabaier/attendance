--POSTGRES
CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	email VARCHAR (50) UNIQUE,
	first_name VARCHAR (50),
	last_name VARCHAR (50),
	roles TEXT
);
CREATE INDEX users_email_idx ON users (email);

CREATE TABLE groups (
	id SERIAL PRIMARY KEY,
	group_name VARCHAR (50)
);

CREATE TABLE courses (
	id SERIAL PRIMARY KEY,
	course_name VARCHAR (50),
	course_number VARCHAR(6),
	semester VARCHAR (6),
	course_year INTEGER,
	start_time VARCHAR (5) NOT NULL,
	end_time VARCHAR (5) NOT NULL,
	group_id integer REFERENCES groups (id) NOT NULL,
	UNIQUE (course_number, course_year, semester, start_time)
);
CREATE INDEX courses_course_number_idx ON courses (course_number);

CREATE TABLE attendance (
	user_id integer REFERENCES users (id),
	course_id integer REFERENCES courses (id),
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

CREATE TABLE assignments (
	id SERIAL PRIMARY KEY,
	title VARCHAR (50),
	start_time timestamptz,
	end_time timestamptz,
	url_link TEXT
);

CREATE TABLE assignment_group (
	assignment_id integer REFERENCES assignments (id) ON DELETE CASCADE,
	group_id integer REFERENCES groups (id) ON DELETE CASCADE
);
CREATE INDEX assignment_group_group_id_idx ON assignment_group (group_id);

CREATE TABLE posts (
	id SERIAL PRIMARY KEY,
	title VARCHAR (50),
	body TEXT,
	url_link TEXT
);

CREATE TABLE post_group (
	post_id integer REFERENCES posts (id) ON DELETE CASCADE,
	group_id integer REFERENCES groups (id) ON DELETE CASCADE,
	open_time timestamptz,
	close_time timestamptz,
	visible boolean DEFAULT TRUE
);
CREATE INDEX post_group_post_id_idx ON post_group (post_id);
CREATE INDEX post_group_group_id_idx ON post_group (group_id);

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
