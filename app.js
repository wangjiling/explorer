#!/usr/bin/env node

require( './db' );

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();
app.set('port', process.env.PORT || 3000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// app libraries
global.__lib = __dirname + '/lib/';


var config = {};

try {
    var configContents = fs.readFileSync('config.json');
    config = JSON.parse(configContents);
}
catch (error) {
    if (error.code === 'ENOENT') {
        console.log('No config file found. Using default configuration (will ' + 
            'download all blocks starting from latest)');
    }
    else {
        throw error;
        process.exit(1);
    }
}

// set default geth host if it's not provided
if (!('gethHost' in config) || (typeof config.gethHost) !== 'string') {
    config.gethHost = 'localhost'; // default
}


// set the default geth port if it's not provided
if (!('gethPort' in config) || (typeof config.gethPort) !== 'number') {
    config.gethPort = 4444; // default
}

// client

app.get('/', function(req, res) {
  res.render('index');
});

require('./routes')(app);

// let angular catch them
app.use(function(req, res) {
  res.render('index');
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var http = require('http').Server(app);
//var io = require('socket.io')(http);

// web3socket(io);

http.listen(app.get('port'), '0.0.0.0', function() {
    console.log('Express server listening on port ' + app.get('port'));
});