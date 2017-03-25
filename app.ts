"use strict";

import * as express from "express";
import * as http from "http";
import * as url from "url";
import * as bodyParser from "body-parser";
import * as morgan from "morgan";
import * as routes from "./routes/index";

let app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));

var env = process.env.NODE_ENV || 'development';
if (env === 'development') {
    //app.use(errorHandler());
}

app.use('/', routes);

app.listen(3000, function () {
  console.log('app listening on port 3000!')
})

export var App = app;