"use strict";

import * as express from "express";
import * as http from "http";
import * as url from "url";
import * as bodyParser from "body-parser";
import * as morgan from "morgan";
import * as routes from "./routes/index";

let app = express();

app.use(express.static('./static'));

app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(morgan('dev'));

var env = process.env.NODE_ENV || 'development';
if (env === 'development') {
    //app.use(errorHandler());
}

app.use('/', routes);

let port: number = process.argv[2] ? parseInt(process.argv[2]) : 3000;

app.listen(port, function () {
  console.log(`app listening on port ${port}!`)
})

export var App = app;
