/*Express Setup*/
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public')); //dir for static files
app.set('view engine', 'jade');

/* Handle all requests to '/' */
var login = require('./routes/login');
app.get('/', login.test); //login page
app.post('/', login.validate); //validate password

/* Handle all requests to '/data' */
var data = require('./routes/data');
app.get('/data', data.populate); //populate queue
app.delete('/data/:id', data.delete_job); //populate queue

/* Handle all requests to '/download' */
var download = require('./routes/download');
app.get('/download/:id', download.download);

/*Start an instance of app*/
var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Print Queue listening at http://%s:%s', host, port); //provides url to where the app is running
});
