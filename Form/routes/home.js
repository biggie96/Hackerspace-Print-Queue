/* This function renders the home page. */
var render_home = function(req, res){
	res.sendFile(require('path').join(__dirname, '/../views/home.html'));
}
exports.render_home = render_home;


/* This function saves form data in aws storage
* The functions make_folder and add_files are only defined
* to address synchronization issues
*/
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

		var cb = function(err, data){ //handle most callbacks
				console.log(err, data);
		}

		var cfg = { headers: req.headers };
		var Busboy = require('busboy');
		busboy = new Busboy(cfg); //parses request for files and fields from form

		/* Store details of print job in a txt file */
		var fs = require('fs');
		fs.unlinkSync('./info.txt'); //delete prexisting copy from other print job

		busboy.on('field', function(fieldname, val){ //add field data to txt file
			if(val == ""){
				return;
			}

			var field_data = val + '\n';
			fs.appendFileSync('./info.txt', field_data);
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
			var info = fs.createReadStream(require('path').join(__dirname, '/../info.txt')); //create stream for file
			var params = {Bucket: time, Key: 'info.txt', Body: info};
			s3.upload(params, function(err, data){
	            if(err){
	            	console.log(err);
	            	res.end('Sorry, an error has occured. Please try again.');
	            	//email me with error
	            }

	        });

			res.end('Your print is now in our queue!');
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
