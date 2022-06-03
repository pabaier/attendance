import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
const MemoryStore = require('memorystore')(session)
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import { authCheckMiddleware, rollCheckMiddleware } from './middleware/auth';
import { userInfo } from 'os';

dotenv.config();

const app = express();
const port = process.env.PORT;
const clientId = process.env.CLIENTID;
const baseURL = process.env.BASEURL;

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
  isAuthed: boolean = false;
  rolls: string[] = [];
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
    req.session.userInfo.isAuthed = true;
    if (payload['email'] == 'baierpa@g.cofc.edu' || payload['email'] == 'baierpa@cofc.edu')
      req.session.userInfo.rolls.push('admin')
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

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});