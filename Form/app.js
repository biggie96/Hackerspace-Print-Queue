/*Express Setup*/
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public')); //dir for static files
app.set('view engine', 'jade');

/*Handle all requests to '/'*/
var home = require('./routes/home');
app.get('/', home.render_home);
app.post('/upload', home.save_form);

/*Setup instance of app*/
var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Print Queue listening at http://%s:%s', host, port); //provides url to where the app is running
});
