import express, { Express, Request, Response } from 'express';
const dotenv = require('dotenv');
const session = require('express-session')
const MemoryStore = require('memorystore')(session)

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(session({
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  secret: 'keyboard cat',
  saveUninitialized: true
}))

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});