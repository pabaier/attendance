from datetime import datetime as time
import datetime as dt


class Code:
    def __init__(self, value=None, date_created=None, ttl=0):
        self.value = value
        self.date_created = date_created
        self.ttl = ttl

    @classmethod
    def init(cls, res):
        # time, res[1], comes in as '2022-01-08 23:32:06.587841'
        return cls(res[0], time.strptime(str(res[1]).split('.')[0], '%Y-%m-%d %H:%M:%S'))

    def get_date_created(self):
        return self.date_created

    def set(self, res):
        self.__init__(res[0], time.strptime(res[1], '%Y-%m-%d %H:%M:%S'))

    def set_ttl(self, ttl):
        self.ttl = ttl

    def is_empty(self):
        return self.value is None

    def is_expired(self, ttl=None):
        ttl_value = self.ttl if ttl is None else ttl
        if ttl_value == 0: return False
        return self.date_created + dt.timedelta(seconds=float(ttl_value)) <= time.utcnow()

    def is_valid(self, code):
        return code == self.value and not self.is_expired()
