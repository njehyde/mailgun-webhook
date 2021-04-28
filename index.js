const express = require('express');
const bodyParser = require('body-parser');
const Mailgun = require('mailgun.js');
const crypto = require('crypto')

const DOMAIN = 'mg.funeralguide.co.uk';
const port = 3001;

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/mailgun', (req, res) => {

  const mailgun = new Mailgun();
  const mg = mailgun.client({
    username: 'api', 
    url: process.env.MAILGUN_URL,
    key: process.env.MAILGUN_ACCESS_KEY, 
  });
  
  // mg.domains.list()
  //   .then(domains => console.log(domains)) // logs array of domains
  //   .catch(err => console.log(err)); // logs any error

  mg.events.get(DOMAIN, { event: ['delivered'],  })
    .then(data => {
      res.json(data.items);
    }) // logs array of event objects
    .catch(err => console.log(err)); // logs any error
});

app.post('/mailgun/webhook', (req, res) => {
  const { 'event-data': eventData } = req.body;
  const { timestamp, token, signature } = req.body.signature || {};

  const verify = ({ signingKey, timestamp, token, signature }) => {
    const encodedToken = crypto
        .createHmac('sha256', signingKey)
        .update(timestamp.concat(token))
        .digest('hex')

    return (encodedToken === signature)
  };

  const result = verify({
    signingKey: process.env.MAILGUN_ACCESS_KEY,
    timestamp,
    token,
    signature,
  });

  res.json({ success: result });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
