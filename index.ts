import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
const MemoryStore = require('memorystore')(session)
import expressLayouts from 'express-ejs-layouts';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT;

// EJS
app.use(expressLayouts)
// Setting the root path for views directory
app.set('views', path.join(`${__dirname}/..`, 'views'));
app.use(express.static(path.join(__dirname, "public")));
// Setting the view engine
app.set('view engine', 'ejs');
// console.log(__dirname)

// SESSIONS
app.use(session({
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  secret: 'keyboard cat',
  saveUninitialized: true
}))

// **********************************************************************************************

app.get('/', (req: Request, res: Response) => {
  res.render('index.ejs', { title: 'Attendance'})

  // res.send('Express + TypeScript Server');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});