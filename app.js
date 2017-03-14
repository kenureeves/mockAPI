'use strict';

const express = require('express'),
	config = require('config'),
	fs = require('fs'),
	https = require('https');

var app = express();

const APP_KEY = (process.env.AppKey) ? process.env.AppKey : config.get('AppKey');
const AUTHORIZATION = (process.env.Authorization) ? process.env.Authorization : config.get('Authorization');

var globePrefixes = ["0905", "0906", "0917", "0926", "0927", "0915", "0916"];

// JSON Values
// Errors
var invalidMSISDNValue = {"result" : {code : "400", status : "error", reason : "Invalid MSISDN value."}};
var unknownBrand = {"result" : {code : "400", status : "error", reason : "Unknown Brand."}};
var invalidAppKey = {"result" : {code : "401", status : "error", reason : "Invalid AppKey."}};
var invalidAccessToken = {"result" : {code : "401", status : "error", reason : "Invalid Access Token"}};
var success = {errCode : "0", brand : ""}

app.get('/', function (req, res) {
  res.send('Hello World! Goodbye! hollo');
  console.log("APP key = %s \n Authorization = %s", APP_KEY, AUTHORIZATION);
});

app.get('/v1/nf/subscriber/brand/:msisdn',function (req, res){
    var rawMSISDN = req.params.msisdn;
    var msisdnLength = rawMSISDN.length;
    var msisdn, prefix, requestAuth, requestAppKey; 
    var isGlobe = false;
    
    requestAuth = req.get("Authorization");
    requestAppKey = req.get("AppKey");
    console.log(requestAuth, AUTHORIZATION);
    //Check AppKey 
    if(requestAppKey != APP_KEY){
    	res.status(401).jsonp(invalidAppKey).end();
    	console.log('[INFO]Error 401. Received invalid MSISDN value.');
    }

    // //Check AppKey 
    if(requestAuth != AUTHORIZATION){
    	res.status(401).jsonp(invalidAccessToken).end();
    	console.log('[INFO]Error 401. Received invalid MSISDN value.');
    }

    //check MSISDN Validity
    if ((msisdnLength == 13) && (rawMSISDN.substr(0,4) == "+639")){
        msisdn = "0" + rawMSISDN.substr(3,10);
    }else if((msisdnLength == 11) && (rawMSISDN.substr(0,2) == "09")){
        msisdn = rawMSISDN;
    }else if((msisdnLength == 10) && (rawMSISDN.substr(0,1) == "9")){
        msisdn = "0" + rawMSISDN;
    }else{
        res.status(400).jsonp(invalidMSISDNValue).end();
        console.log('[INFO]Error 400. Received invalid MSISDN value.');
    }

    console.log('[INFO]MSISDN received: %s', msisdn);
    console.log('[DEBUG] %s', msisdn);
    	prefix = msisdn.substr(0, 4);    

    for (var i = 0; i < globePrefixes.length; i++){
    	if (prefix == globePrefixes[i]){
    		isGlobe = true;
    	}
	}

	/*
	*
	*For the POC, identifying Globe or TM Subscirber is 2 and 3
	*respectively. 0927102**** for Globe and 0927103**** for TM
	*
	*/
	var globeTMIdentifier = msisdn.substr(6,1);

	switch (globeTMIdentifier){
		case "2": success.brand = "1";
		break;

		case "3" : success.brand = "2";
		break;

		default : success.brand = "1";
	}

	if (isGlobe == false){
		res.status(400).jsonp(unknownBrand);
		console.log('[INFO]Error 400. Received unkonw brand.');
		res.end();
	}
    res.status(200).jsonp(success).end();
    console.log('[INFO]Brand identified and sent: %s for %s',success.brand, msisdn);
    res.end();
    
});

// app.listen(3000, function () {
//   console.log('Mock \"Get Subscriber Brand\" App is listening on port 3000.');
// });
var secureServer = https.createServer({
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.crt'),
    ca: fs.readFileSync('./ssl/ca.crt'),
    requestCert: true,
    rejectUnauthorized: false
}, app).listen('3000', function() {
    console.log("Secure Express server listening on port 3000");
});