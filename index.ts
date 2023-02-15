import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import session from 'express-session';
const MemoryStore = require('memorystore')(session)
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import NodeCache from "node-cache";
import { Alert, User, UserSettings } from './models';
import { admin, assessment, auth, base, user } from './routes';
import dbClient from './db/dbClientPSQLImpl';

const app = express();
const port = process.env.PORT;
const myCache = new NodeCache(); // cache for this instance of express js - like a global store, stored locally on server

// EJS
app.use(expressLayouts)
// Setting the root path for views directory
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, "../public")));
// Setting the view engine
app.set('view engine', 'ejs');

// overload SessionData so our custom properties exist on the session object
declare module "express-session" {
  interface SessionData {
    user: User,
    alert?: Alert[],
    userSettings: UserSettings,
  }
}

// server side cookie storage
// users only store a session id in a local cookie
app.use(session({
  cookie: { maxAge: 86400000, sameSite: 'strict' },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  secret: [process.env.SESSION_SECRET as string, 'keyboard cat'],
  saveUninitialized: true
}))

// used to get the body from post requests
app.use(express.json());
app.use(express.urlencoded());

// add user to all responses
app.use(function(req: Request, res: Response, next: NextFunction) {
  res.locals.user = req.session.user
  next()
})
app.use('/assessment', assessment(myCache, dbClient));
app.use('/admin', admin(myCache, dbClient));
app.use('/auth', auth(myCache, dbClient));
app.use('/user', user(myCache, dbClient));
app.use('/', base(dbClient))

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});