/*
  audiochat.js

  All JS code for audio chat on app server-side. App server used to generate token,
  which is used to verify meeting participant to the Audio Chat server.

  */
var jwt = require("jsonwebtoken");
var uuid4 = require("uuid4");

// Need to generate from app.videosdk.live
const API_KEY = "5cfc5cf1-4ea2-450d-8665-c37178cfad4b";
const SECRET_KEY = "26f28a6fac8fc6fa540ee123fc790c002f021c99d8cc030daa7bbe2638c1b51c";

jwt.sign(
  {
    apikey: API_KEY,
    permissions: ["allow_join"], // Permission to join the meeting
  },
  SECRET_KEY,
  {
    algorithm: "HS256",
    expiresIn: "24h",
    jwtid: uuid4(),
  },
  function (err, token) {
    console.log(token);
  }
);
