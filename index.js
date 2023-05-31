const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const axios = require("axios");
const { TwitterApi } = require("twitter-api-v2");
const CALLBACK_URL = "http://localhost:443/api/auth/callback/twitter";
const { Client, auth } = require("twitter-api-sdk");
const {getToken} = require('./tokenService');
const qs = require("qs");
var path = require("path");
const Twitter = require('twitter');

var corsOptions = {
  origin: [
    "http://localhost:3000", "https://voluble-unicorn-fad212.netlify.app"
  ],
  exposedHeaders: ["Authorization", "Access-Control-Allow-Origin"],
  preflightContinue: true
};

app.use(express.json());
app.use(cors(corsOptions));

const authClient = new auth.OAuth2User({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  callback: "http://incentive-app.onrender.com/callback",
  scopes: ["tweet.read", "users.read"],
});


const client = new Client(authClient);

const STATE = "my-state";

// const client = new Client(process.env.BEARER_TOKEN);

app.get("/me", async function (req, res) {
  try {
    const clientUsernameToken = new Client(process.env.BEARER_TOKEN);
    const {username} = req.query;
    const user = await clientUsernameToken.users.findUserByUsername(username, {
      "user.fields": ["name","profile_image_url"]
    });
    res.status(200).send({user: user.data, status: true});
  } catch(error) {
    res.status(401).send({message: 'Cannot get user details', status: false});
  }
})

app.get("/username", async function (req, res) {
    try{
      const clientUsernameToken = new Client(process.env.BEARER_TOKEN);
      const {toUsername, fromUsername} = req.query;
      const user = await clientUsernameToken.users.findUsersByUsername({
        usernames: [toUsername, fromUsername],
        "user.fields": ["profile_image_url"]
      })
      res.status(200).send({profiles:user.data, status: true});
    } catch (error) {
      res.status(401).send({message:'Error retrieving username', status: false});
    }
})


app.get("/usernames", async function (req, res) {
  try {
    const {name} = req.query;
    const twitter = new Twitter({
      consumer_key: process.env.KEY,
      consumer_secret: process.env.SECRET,
      access_token_key: process.env.ACCESS_TOKEN,
      access_token_secret: process.env.ACCESS_TOKEN_SECRET
    });

    twitter.get('users/search', {q: name})
    .then((data) => {
      res.status(200).send({userList:data, status:true})
    })
    .catch((err) => {
      res.status(401).send({message: err[0].message, status:false});
    });
  } catch (error) {
    res.status(401).send({message: 'Cannot send tweet', status: false})
  }
})

app.post('/api/tweet', async (req, res) => {
  try {
    const tweet = req.body.tweetText;
    const twitter = new Twitter({
      consumer_key: process.env.KEY,
      consumer_secret: process.env.SECRET,
      access_token_key: process.env.ACCESS_TOKEN,
      access_token_secret: process.env.ACCESS_TOKEN_SECRET
    });

    twitter.post('/statuses/update', {status: tweet})
    .then((data) => {
      if(data.id) {
        res.status(200).send({tweetId: data.id, status:true});
      }
    })
    .catch((err) => {
      res.status(201).send({message: err[0].message, status:false});
    });
  } catch (error) {
    res.status(401).send({message: 'Cannot send tweet', status: false})
  }
});

// app.get("/callback", async function (req, res) {
//   try {
//     const { code, state } = req.query;
//     if (state !== STATE) return res.status(500).send("State isn't matching");
//     const data = await authClient.requestAccessToken(code);
//     const user = await client.users.findMyUser({
//       "user.fields": ["created_at", "profile_image_url", "username"]
//     });
//     user.data.token = data.token;
//     res.status(200).json({user: user});
//   } catch (error) {
//     console.log(error);
//   }
// });

// app.get("/login", async function (req, res) {
//   const authUrl = authClient.generateAuthURL({
//     state: STATE,
//     code_challenge_method: "s256",
//   });
//   res.status(200).send({redirectUri:authUrl});
// });

// app.get("/tweets", async function (req, res) {
//   const tweets = await client.users.findMyUser();
//   res.send(tweets.data);
// });

// app.get("/revoke", async function (req, res) {
//   try {
//     const response = await authClient.revokeAccessToken();
//     res.send(response);
//   } catch (error) {
//     console.log(error);
//   }
// });

app.get("/api/tweet/random", async (req, res) => {
  const config = {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
    },
    params: {
      count: 100,
      tweet_mode: "extended",
      lang: "en",
      include_rts: true,
      screen_name: "eckharttolle",
    },
  };

  axios
    .get("https://api.twitter.com/1.1/statuses/user_timeline.json", config)
    .then((twitterResponse) => {
      const randNumber = Math.floor(
        Math.random() * twitterResponse.data.length
      );
      const randTweet = twitterResponse.data[randNumber];
      res.send(randTweet);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.use(express.static("client/build"));

app.get("/", function (request, response) {
  const filePath = path.resolve(__dirname, "client", "build", "index.html");
  response.sendFile(filePath);
}); 

app.listen(process.env.PORT || 666, () => console.log(`Example app listening on port ${process.env.PORT}!`));
