import sqlite3
from models.code import Code


class DbClient:

    def __init__(self, db_name='attendance.db'):
        self.con = sqlite3.connect(db_name, check_same_thread=False)
        self.cur = self.con.cursor()

    def get_code(self):
        res = self.cur.execute('SELECT * FROM code ORDER BY date_created DESC')
        top_res = tuple(res.fetchone())
        return Code.init(top_res)

    def insert_code(self, code):
        self.delete_code()
        self.cur.execute(f'INSERT INTO code(code) VALUES ("{code}")')
        self.con.commit()

    def delete_code(self):
        self.cur.execute('DELETE FROM code')

    def add_user_attendance(self, email):
        res = self.cur.execute(f'SELECT id FROM users WHERE email = "{email}"')
        user_id = tuple(res.fetchone())[0]
        self.cur.execute(f'INSERT INTO attendance(user_id) VALUES ("{user_id}")')
        self.con.commit()
