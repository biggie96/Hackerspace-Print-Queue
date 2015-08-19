/* This function renders the home page. */
var render_home = function(req, res){
	res.sendFile(require('path').join(__dirname, '/../views/home.html'));
}
exports.render_home = render_home;


/* This function saves form data in aws storage */
var save_form = function(req, res){
	if(parseInt(req.headers['content-length'], 10) > (11 * 1024 * 1024)){ //10mb upload limit
		res.end('File(s) are too big');
	}
	else{
		make_folder()
	}

	/*creates folder for print job*/
	function make_folder(){
		var AWS = require('aws-sdk');
		AWS.config.loadFromPath(require('path').join(__dirname, '/../aws-secret.json'));
    var s3 = new AWS.S3();
    var time = new Date().getTime().toString();
    var params = { Bucket: time}; //name of folder to be created
    s3.createBucket(params, function(err, data){
    	if(err){
    		res.end('Sorry, an error has occured. Please try again.');
    		//email me with error
    	}
    	else{
    		add_files(s3, time)
    	}
    });
	}

	/* Adds files to folder */
    function add_files(s3, time){
			//setup parse
			var Parse = require('parse').Parse;
			Parse.initialize("0rEzgPPAwytqrJSqzmNgHlErv6bnV9urmcMYmQf9", "gucaNYqC7tM5mSwb48LY4KeQN5JpafxhWBq81ID0");
			var PrintInfo = Parse.Object.extend("PrintInfo");
			var printInfo = new PrintInfo();
			printInfo.set("folderName", time);

			var cb = function(err, data){ //handle most callbacks
					console.log(err, data);
			}

			var cfg = { headers: req.headers };
			var Busboy = require('busboy');
			busboy = new Busboy(cfg); //parses request for files and fields from form

			/* Store details of print job in Parse */
			busboy.on('field', function(fieldname, val){
				switch(fieldname){
					case "name":
						printInfo.set("name", val);
						break;
					case "netID":
						printInfo.set("netID", val);
						break;
					case "email":
						printInfo.set("email", val);
						break;
					case "notes":
						printInfo.set("notes", val);
						break;
					case "color":
						printInfo.set("color", val);
						break;
				}
			});

			/* Store form files in aws */
			busboy.on('file', function(fieldname, file, filename, encoding, mimetype){
				var params = {Bucket: time, Key: filename, Body: file};
				s3.upload(params, function(err, data){
		            if(err){
		            	res.end('Sorry, an error has occured. Please try again.');
		            	//email me with error
		            	console.log(err);
		            }
		        });

			});

			busboy.on('finish', function(){
				printInfo.save(null, {
					success: function(printInfo){
						/* email my boss so he knows something just got added to the queue */
						// configure sendgrid
						var fs = require('fs');
					  var credentials = fs.readFileSync('./sendgrid-api.cfg', 'utf8').split('\n'); //get sendgrid info
					  var sendgrid = require('sendgrid')(credentials[0], credentials[1]);
						// Get body of email
					  //var to = 'mcgrew@cs.rutgers.edu';
						var to = 'mcgrew@cs.rutgers.edu';
					  var sender = 'biggieemmanuel@gmail.com';
					  var subject = 'Print added to queue';
					  var text = 'Hey, ' + printInfo.get("name") + ' just added something to the queue. \n' + 'View Queue at: https://hackerspace-print-queue.herokuapp.com/';
						// send email
					  sendgrid.send({
					  to:       to,
					  from:     sender,
					  subject:  subject,
					  text:     text
					  }, function(err, json) {
							console.log(json);
					    if (err) {
					       console.log('@sendgrid: ' + err);
					    }
					    console.log('@sendgrid: ' + json.message);
					  });

						res.end('Your print is now in our queue!');
					},

					error: function(printInfo, error){
						console.log(err);
	        	return res.end('Sorry, an error has occured. Please try again.');
					}

				});
			});

			req.pipe(busboy); //pipe request to busboy
	}
}
exports.save_form = save_form;


/*I use this function for experimenting/debugging */
var test = function(req, res){
console.log(req.params);
}
exports.test = test;
