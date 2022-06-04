### Requirements

* local postgresql database: `docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -d -p 1234:5432 postgres`

##### Env Variables

* `DATABASE_URL`
* `BASE_URL`
* `CODE_REFRESH_RATE` - how long codes last, and how quickly the code page refreshes, in seconds