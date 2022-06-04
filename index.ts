import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
const MemoryStore = require('memorystore')(session)
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import { authCheckMiddleware, rollCheckMiddleware } from './middleware/auth';
import { userInfo } from 'os';
import NodeCache from "node-cache";
import pgp from 'pg-promise'
import { DBClient } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT;
const clientId = process.env.CLIENTID;
const baseURL = process.env.BASEURL;
const codeRefreshRate: number = parseInt(process.env.CODE_REFRESH_RATE || '2');
const databaseURL: string = process.env.DATABASE_URL as string;

// EJS
app.use(expressLayouts)
// Setting the root path for views directory
app.set('views', path.join(`${__dirname}/..`, 'views'));
app.use(express.static(path.join(__dirname, "public")));
// Setting the view engine
app.set('view engine', 'ejs');

// SESSIONS
class UserInfo {
  userName: string = '';
  userEmail: string = '';
  roles: string[] = [];
  isAdmin: boolean = false;
}

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

// GOOGLE AUTH
const client = new OAuth2Client(clientId);
// used to get the body from post requests
app.use(express.json());
app.use(express.urlencoded());

// IN MEMORY CACHE
const myCache = new NodeCache();

// DATABASE
const db = pgp()(
  {
    connectionString: databaseURL, 
    ssl: baseURL?.includes('localhost') ? false : { rejectUnauthorized: false }
}
)
const dbClient = new DBClient(db)


// **********************************************************************************************

app.get('/', (req: Request, res: Response) => {
  res.render('index', { title: 'Attendance', userInfo: req.session.userInfo })

  // res.send('Express + TypeScript Server');
});

app.get('/about', (req: Request, res: Response) => {
  res.render('about', {userInfo: req.session.userInfo})
});

app.post('/login/verify', async (req: Request, res: Response) => {
  const ticket = await client.verifyIdToken({
    idToken: req.body.credential,
    audience: clientId,
  });
  const payload = ticket.getPayload() || null;
  if (!req.session.userInfo) {
    req.session.userInfo = new UserInfo();
  }
  if (payload) {
    req.session.userInfo.userName = payload['given_name'] || '';
    req.session.userInfo.userEmail = payload['email'] || '';
    if (payload['email'] == 'baierpa@cofc.edu' || payload['email'] == 'baierpa@cofc.edu')
      req.session.userInfo.roles.push('admin')
    const userid = payload['sub'];
    const lastName = payload['family_name'];
    const fullName = payload['name'];
    const domain = payload['hd'];
  }
  var redirect: string = req.query.redirect?.toString() || '/'
  res.redirect(redirect)
});

app.get('/login', (req: Request, res: Response) => {
  res.render('login', { clientId, baseURL, redirect: req.query.redirect, userInfo: req.session.userInfo })
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => null);
  res.redirect('/')
});

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

app.get('/admin', authCheckMiddleware, rollCheckMiddleware(['admin']), (req: Request, res: Response) => {
  res.render('admin', { userInfo: req.session.userInfo })
});

app.get('/admin/code/', authCheckMiddleware, rollCheckMiddleware(['admin']), (req: Request, res: Response) => {
  res.render('code', { userInfo: req.session.userInfo })
});

app.get('/admin/code/update', authCheckMiddleware, rollCheckMiddleware(['admin']), (req: Request, res: Response) => {
  const newNumber: number = Math.floor(Math.random() * 9) + 1;
  const value: number = myCache.has( 'code' ) ? myCache.take( 'code' ) as number : 0;
  myCache.set( 'code', (value * 10 + newNumber) % 100000, codeRefreshRate/1000 + 500);
  res.json({ code: newNumber })
});


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});