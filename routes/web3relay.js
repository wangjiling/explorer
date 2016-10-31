#!/usr/bin/env node

/*
    Endpoint for client to talk to etc node
*/

var Web3 = require("web3");
var web3;

var BigNumber = require('bignumber.js');
var etherUnits = require(__lib + "etherUnits.js")

var extractTX = require('./filters').extractTX;
var getLatestBlocks = require('./index').getLatestBlocks;

// load config
var fs = require('fs');
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

if (typeof web3 !== "undefined") {
  web3 = new Web3(web3.currentProvider);
} else {
  var web3 = new Web3(new Web3.providers.HttpProvider('http://' + config.gethHost.toString() + ':' + config.gethPort.toString()));
}

if (web3.isConnected()) 
  console.log("Web3 connection established");
else
  throw "No connection";


var newBlocks = web3.eth.filter("latest");
var newTxs = web3.eth.filter("pending");

/*
exports.clientSocket = function(io) {

  newBlocks.watch(function (error, log) {
    console.log('### JSON emitted to block client: ' + JSON.stringify(log));
    io.emit('block', log);
  });

  newTxs.watch(function (error, log) {
    console.log('### JSON emitted to transaction client: ' + JSON.stringify(log));
    io.emit('tx', log);
  });

}
*/

exports.data = function(req, res){
  console.log(req.body)
  
  if ("addr" in req.body) {
    var addr = req.body.addr.toLowerCase();
    var options = req.body.options;

    var addrData = {};

    if (options.indexOf("balance") > -1) {
      try {
        addrData["balance"] = web3.eth.getBalance(addr);  
        addrData["balance"] = etherUnits.toEther(addrData["balance"], 'wei');
      } catch(err) {
        console.error("AddrWeb3 error retrieving balance :" + err);
        addrData = {"error": true};
      }
    }
    if (options.indexOf("count") > -1) {
      try {
         addrData["count"] = web3.eth.getTransactionCount(addr);
      } catch (err) {
        console.error("AddrWeb3 error retrieving transaction count :" + err);
        addrData = {"error": true};
      }
    }
    if (options.indexOf("bytecode") > -1) {
      try {
         addrData["bytecode"] = web3.eth.getCode(addr);
         if (addrData["bytecode"].length > 2) 
            addrData["isContract"] = true;
         else
            addrData["isContract"] = false;
      } catch (err) {
        console.error("AddrWeb3 error retrieving bytecode :" + err);
        addrData = {"error": true};
      }
    }
   
    console.log('web3relay response');
	console.log(JSON.stringify(addrData));
	
    res.write(JSON.stringify(addrData));
    res.end();


  } else if ("tx" in req.body) {
    var txHash = req.body.tx.toLowerCase();

    web3.eth.getTransaction(txHash, function(err, tx) {
      if(err || !tx) {
        console.error("TxWeb3 error :" + err)
        res.write(JSON.stringify({"error": true}));
      } else {
        var ttx = tx;
        ttx.value = etherUnits.toEther( new BigNumber(tx.value), "wei");
        res.write(JSON.stringify(ttx));
      }
      res.end();
    });

  } else {
  
    console.error("Invalid Request: " + action)
    res.status(400).send();
  }

};

exports.eth = web3.eth;
  