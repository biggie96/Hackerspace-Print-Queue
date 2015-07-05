/*Express Setup*/
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public')); //dir for static files
app.set('view engine', 'jade');

/* Handle all requests to login page */
var login = require('./routes/login');
app.get('/', login.login); //login page
app.post('/', login.validate); //validate password

/* Handle all requests to queue page */
var queue = require('./routes/queue');
app.get('/queue', queue.populate); //populate queue
app.delete('/queue', queue.remove_job); //remove print
app.post('/queue', queue.notify); //email recipient
app.get('/queue/download', queue.download); //download files in print job

/*Start an instance of app*/
var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Print Queue listening at http://%s:%s', host, port); //provides url to where the app is running
});
