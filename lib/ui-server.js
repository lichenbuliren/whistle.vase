var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var util = require('./util');
var engine = require('./engine');
var APP_ROOT = util.formatPath(path.join(__dirname, '../app'));
var APP_CGI_ROOT = util.formatPath(path.join(APP_ROOT, 'cgi-bin'));
var dataMgr = require('./data-mgr');
var CGI_MODULES = util.loadModulesSync(APP_CGI_ROOT);
var SSL_FLAG_HEADER;

app.use(function(req, res, next) {
	req.on('error', util.noop);
	res.on('error', util.noop);
	next();
});

app.use(bodyParser.urlencoded({ extended: true, limit: '1mb'}));
app.use(bodyParser.json());

app.all('/cgi-bin/*', function(req, res) {
	if (req.headers.origin) {
		res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
		res.setHeader('Access-Control-Allow-Credentials', true);
	}
	
	var controller = CGI_MODULES[APP_ROOT + req.url.replace(/\?.*$/, '')];
	if (!controller) {
		res.status(404).end('Not found');
		return;
	}
	
	try {
		this.dataMgr = dataMgr;
		controller.call(this, req, res);
	} catch(e) {
		res.status(500).end(e.stack);
	}
});
app.use(express.static(path.join(__dirname, '../app/public')));

module.exports = function startUIServer(server, options) {
	SSL_FLAG_HEADER = options && options.SSL_FLAG_HEADER;
	server.on('request', app);
};