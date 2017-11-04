/**
 * The purpose of this application is to provide a single interface for any backend services
 * required by the Bell Curve application
 */

// require components
const express = require('express');
const morgan = require('morgan');
const PORT = 3000;

// require defined endpoints
const api = require("./api/api.js");

// create app
const app = express();

// use a logger
app.use(morgan('dev'));

// use the defined endpoints
app.use('/api', api);

app.get('/', function(req, res) {
	res.status(500).json({
		error: "Please use the 'api' namespace and specify a ticker in the query string"
	});
});

// listen
var port = process.env.PORT || PORT;
app.listen(port, function() {
	console.log("Bell Curve API is listening on port ".concat(port));
});

