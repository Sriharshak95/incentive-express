const https = require('https');
const querystring = require('querystring');

const consumerKey = process.env.KEY;
const consumerSecret = process.env.SECRET;
const bearerToken = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

async function getToken() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.twitter.com',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        Authorization: `Basic ${bearerToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to get access token: ${data}`));
        } else {
          const { access_token } = JSON.parse(data);
          resolve(access_token);
        }
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.write(querystring.stringify({ grant_type: 'client_credentials' }));
    req.end();
  });
}

module.exports = { getToken };
