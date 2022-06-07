import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import session from 'express-session';
const MemoryStore = require('memorystore')(session)
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { authCheckMiddleware } from './middleware/auth';
import NodeCache from "node-cache";
import { UserInfo } from './models';
import dbClient from './db/dbClientPSQLImpl';
import { admin, base } from './routes';

const app = express();
const port = process.env.PORT;
const myCache = new NodeCache();

// EJS
app.use(expressLayouts)
// Setting the root path for views directory
app.set('views', path.join(`${__dirname}/..`, 'views'));
app.use(express.static(path.join(__dirname, "public")));
// Setting the view engine
app.set('view engine', 'ejs');

// overload SessionData so our custom properties exist on the session object
declare module "express-session" {
  interface SessionData {
    userInfo: UserInfo
  }
}

app.use(session({
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  secret: 'keyboard cat',
  saveUninitialized: true
}))


// used to get the body from post requests
app.use(express.json());
app.use(express.urlencoded());

app.use('/admin', admin(myCache));
app.use('/', base)

// **********************************************************************************************

app.get('/dashboard', authCheckMiddleware, (req: Request, res: Response) => {
  res.render('dashboard', { userInfo: req.session.userInfo })
});

app.get('/attendance', authCheckMiddleware, (req: Request, res: Response) => {
  res.render('attendance', { userInfo: req.session.userInfo })
});

app.post('/attendance', authCheckMiddleware, (req: Request, res: Response) => {
  const result = parseInt(req.body.code) == myCache.get( 'code' ) as number
  if (result) {
    dbClient.signIn(req.session.userInfo?.userEmail as string)
  }
  res.json({result: result})
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});