import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
const MemoryStore = require('memorystore')(session)
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';

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
// overload SessionData so our custom properties exist on the session object
declare module "express-session" {
  interface SessionData {
    userName: string;
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
  res.render('index', { title: 'Attendance' })

  // res.send('Express + TypeScript Server');
});

app.get('/about', (req: Request, res: Response) => {
  res.render('about')
});

app.post('/login/verify', async (req: Request, res: Response) => {
  req.session.userName = await verify(req.body.credential)
  res.redirect('/dashboard')
});

app.get('/login', (req: Request, res: Response) => {
  res.render('login', { clientId, baseURL })
});

app.get('/dashboard', (req: Request, res: Response) => {
  const userName = req.session.userName;
  res.render('dashboard', { userName })
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

async function verify(token: string) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (payload) {
    const userid = payload['sub'];
    const firstName = payload['given_name'];
    const lastName = payload['family_name'];
    const fullName = payload['name'];
    const email = payload['email'];
    const domain = payload['hd'];
    return firstName
  }
}