/* This function notifies the recipent that their print is completed */
var notify = function(req, res){
  console.log('got it');
  var fs = require('fs');
  var credentials = fs.readFileSync('./sendgrid-api.cfg', 'utf8').split('\n');

  var sendgrid = require('sendgrid')(credentials[0], credentials[1]);

  var to = req.query.email;
  var sender = 'Hackerspaceemail@gmail.com';
  var subject = 'Hackerspace Print Completed!';
  var text = 'Hello ' + req.query.name + ', your print is finished! Please come pick it up at your earliest convenience. \n Completed by: ' + req.query.employee;

console.log(to);
  sendgrid.send({
  to:       to,
  from:     sender,
  subject:  subject,
  text:     text
  }, function(err, json) {
    if (err) {
       console.error(err);
       return res.end();
    }
    console.log(json);
    res.end();
  });
}
exports.notify = notify;
