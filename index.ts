import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import session from 'express-session';
const MemoryStore = require('memorystore')(session)
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import { authCheckMiddleware } from './middleware/auth';
import NodeCache from "node-cache";
import { UserInfo } from './models';
import dbClient from './db/dbClientPSQLImpl';
import { admin } from './routes';

const app = express();
const port = process.env.PORT;
const clientId = process.env.CLIENTID;
const baseURL = process.env.BASEURL;
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

// GOOGLE AUTH
const client = new OAuth2Client(clientId);
// used to get the body from post requests
app.use(express.json());
app.use(express.urlencoded());

app.use('/admin', admin(myCache));

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
    const email = payload['email'] || ''
    req.session.userInfo.userName = payload['given_name'] || '';
    req.session.userInfo.userEmail = email;
    if (payload['email'] == 'baierpa@cofc.edu' || payload['email'] == 'baierpa@cofc.edu')
      req.session.userInfo.roles.push('admin')
    const userid = payload['sub'];
    const lastName = payload['family_name'];
    const fullName = payload['name'];
    const domain = payload['hd'];
    const userId = await dbClient.getUserId(email);
    if(!userId) {
      const message = 'Sorry, user not found. Contact your administrator.'
      res.redirect(`/logout?message=${message}`)
      return
    }
    req.session.userInfo.userId = userId;
  }
  const redirect: string = req.query.redirect?.toString() || '/'
  res.redirect(redirect)
});

app.get('/login', (req: Request, res: Response) => {
  const message =  req.query.message ? req.query.message : ''
  res.render('login', { clientId, baseURL, redirect: req.query.redirect, userInfo: req.session.userInfo, message: message})
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => null);
  const redirect =  req.query.message ? `/login?message=${req.query.message}` : '/login';
  res.redirect(redirect)
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

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});