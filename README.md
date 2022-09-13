### Requirements

* local postgresql database: `docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -d -p 1234:5432 postgres`

##### Env Variables

* `DB_URL`
* `BASE_URL`
* `CODE_REFRESH_RATE` - how long codes last, and how quickly the code page refreshes, in seconds
* `CODE_TIME_START` - minutes before class that the code should open
* `CODE_TIME_WINDOW` - minutes after starting that the code is open
* `SYLLABUS_URL`
* `TZ` - app timezone (used for Heroku. Should be `America/New_York`)
* `PGSSLMODE` - should be `no-verify`
* `DATABASE_SSL` - should be `true` or `false` depending on if the database supports SSL

### Deploying
##### Fly.io
fly.io has a command line tool. To deploy, run
```
flyctl auth login
flyctl deploy
```

To connect to a database hosted on fly.io
from a shell
```
flyctl postgres connect -a <postgres-app-name>
```
from a db client, first run a proxy command, then connect to `localhost`
```
flyctl proxy 5432 -a cofc-pg
```
