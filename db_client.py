from models.code import Code


class DbClient:

    def __init__(self, connection):
        self.con = connection
        self.cur = self.con.cursor()

    def get_code(self):
        res = self.cur.execute('SELECT * FROM code ORDER BY date_created DESC')
        top_res = tuple(res.fetchone())
        return Code.init(top_res)

    def insert_code(self, code):
        self.delete_code()
        self.cur.execute(f'INSERT INTO code (value) VALUES ("{code}")')
        self.con.commit()

    def delete_code(self):
        self.cur.execute('DELETE FROM code')

    def add_user_attendance(self, user):
        self.cur.execute(f'INSERT INTO attendance (user_name) VALUES ("{user}")')
        self.con.commit()

    # def add_user_attendance_old(self, email):
    #     res = self.cur.execute(f'SELECT id FROM users WHERE email = "{email}"')
    #     user_id = tuple(res.fetchone())[0]
    #     self.cur.execute(f'INSERT INTO attendance (user) VALUES ("{user_id}")')
    #     self.con.commit()

    def get_classes_for_user(self, user_id):
        sql = f'SELECT * FROM'
