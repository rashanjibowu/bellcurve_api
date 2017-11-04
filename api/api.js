var express = require('express');
var dotenv = require('dotenv');
var request = require('request');

var app = express();

// grab the API key
dotenv.config();
var apiKey = process.env.ALPHAVANTAGE_API_KEY;

/**
 * Body is an object where we care about the value keyed at "Time Series (Daily)"
 * This value is also an object where each key is a date formatted as "YYYY-MM-DD".
 * The value at each date is also an object whose keys are "1. open", "2. high", "3. low", "4. close", and "5. volume"
 * We want to return an array sorted by date stamp in ascending order and each object in the array has the keys
 * "open", "high", "low", "close", "volume" -- with no numbers
 */
function parseTimeSeries(body, type) {

	var value = (type.toLowerCase() == "daily") ? body['Time Series (Daily)'] : body['Time Series (1min)'];

	var array = [];

	for (date in value) {
		if (value.hasOwnProperty(date)) {
			array.push({
				"timestamp": date,
				"open": +value[date]['1. open'],
				"high": +value[date]['2. high'],
				"low": +value[date]['3. low'],
				"close": +value[date]['4. close'],
				"volume": +value[date]['5. volume']
			});
		}
	}

	// sort in ascending order
	array = array.sort(function(a, b) {
		return new Date(a.timestamp) - new Date(b.timestamp);
	});

	return array;
}

/**
 * Retrieve price history for a given security
 * Forward request to AlphaVantage API
 */
app.get('/priceHistory', function(req, res) {

	// make sure that there is a query string
	if (!req.query.symbol) {
		res.status(400).json({
			error: 'Please include a symbol'
		});

		return;
	}

	// generate the URL
	var resourceURL = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY';
    resourceURL = resourceURL.concat('&symbol=', req.query.symbol);
    resourceURL = resourceURL.concat('&apikey=', apiKey);
    resourceURL = resourceURL.concat('&datatype=json');

    // request price history
    request(resourceURL, function(error, response, body) {
        if (error) {
            res.status(500).json({
            	error: 'Unable to complete request'
            });

            return;
        }

        if (response.statusCode != 200) {
            res.status(response.statusCode).json({
            	error: error
        	});
            return;
        }

        // we have the data!
        var parsed = JSON.parse(body);

        if (parsed['Error Message']) {

        	if (parsed['Error Message'].startsWith('Invalid API call')) {
	        	res.status(400).json({
	        		error: "Invalid API Call. Please try another ticker"
	        	});
        	} else {
        		res.status(500).json({
	        		error: "Problem with underlying API"
	        	});
        	}
			return;
        }

        res.status(200).json(parseTimeSeries(parsed, "daily"));
    });
});

/**
 * Retrieve current price for a given security
 * Forward request to AlphaVantage API
 */
app.get('/currentPrice', function(req, res) {
	// make sure that there is a query string
	if (!req.query.symbol) {
		res.status(400).json({
			error: 'Please include a symbol'
		});

		return;
	}

	var resourceURL = 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY';
    resourceURL = resourceURL.concat('&symbol=', req.query.symbol);
    resourceURL = resourceURL.concat('&interval=1min');
    resourceURL = resourceURL.concat('&apikey=', apiKey);
    resourceURL = resourceURL.concat('&datatype=json');

    request(resourceURL, function(error, response, body) {
        if (error) {
            res.status(500).json({
            	error: 'Unable to complete request'
            });

            return;
        }

        if (response.statusCode != 200) {
            res.status(response.statusCode).json({
            	error: error
        	});
            return;
        }

        // we have the data!
        var parsed = JSON.parse(body);

        if (parsed['Error Message']) {

        	if (parsed['Error Message'].startsWith('Invalid API call')) {
	        	res.status(400).json({
	        		error: "Invalid API Call. Please try another ticker"
	        	});
        	} else {
        		res.status(500).json({
	        		error: "Problem with underlying API"
	        	});
        	}
			return;
        }

        res.status(200).json(parseTimeSeries(parsed, "1min"));
    });
});

/**
 * Show error on base API call
 */
app.get('/', function(req, res) {
	res.status(500).json({
		error: "Please use the 'priceHistory' or 'currentPrice' endpoints and specify a ticker in the query string"
	});
});

module.exports = app;