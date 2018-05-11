"use strict";

const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();

const nodes = require("./nodes/router");
const projects = require("./projects/router");

app.use(bodyParser.json({ strict: false }));
app.use("/nodes", nodes);
app.use("/projects", projects);

module.exports.handler = serverless(app);
