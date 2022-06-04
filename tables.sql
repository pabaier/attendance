--POSTGRES
CREATE TABLE attendance (
	user_name varchar NOT NULL,
	date_created timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX attendance_user_name_idx ON attendance (user_name);
CREATE INDEX attendance_date_created_idx ON attendance (date_created);