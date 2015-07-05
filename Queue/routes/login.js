/* This function renders the home page. */
var login = function(req, res){
	res.sendFile(require('path').join(__dirname, '/../views/login.html'));
}
exports.login = login;

/* This function validates the password */
var validate = function(req, res){
	var cfg = {
		headers: req.headers,
	};
	var Busboy = require('busboy');
	busboy = new Busboy(cfg); //parses request for files and fields from form

	busboy.on('field', function(fieldname, val){ //get password input
			if(val == ""){
				res.sendFile(require('path').join(__dirname, '/../views/queue.html'));
			}
			else{
				res.render('output', {title: 'Incorrect', message: 'Password is incorrect, please try again.'});
				res.end();
			}
	});

	busboy.on('finish', function(){ });

	req.pipe(busboy); //pipe request to busboy
}
exports.validate = validate;

/* This function is for testing/debugging purposes */
var test = function(req, res){
	res.sendFile(require('path').join(__dirname, '/../views/queue.html'));
}
exports.test = test;
