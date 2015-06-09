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
	if(parseInt(req.headers['content-length'], 10) > (10 * 1024 * 1024)){ //10mb upload limit
		res.render('error', {title: 'Max filesize exceeded', message: 'File too big'});
		res.end();
	}
	else{
		make_folder()
	}
 
	/*creates folder for print job*/
	function make_folder(){
		var AWS = require('aws-sdk');
		AWS.config.loadFromPath('./aws-secret.json');
	    var s3 = new AWS.S3();
	    var time = new Date().getTime().toString();
	    var params = { Bucket: time}; //name of folder to be created
	    s3.createBucket(params, function(err, data){ 
	    	if(err){
	    		res.render('error', {title: 'Error', message: 'sorry, shit happens'});
				res.end();
	    		//email me with error
	    	}

	    	add_files(s3, time)
	    });
	}

	/* Adds files to folder */
    function add_files(s3, time){

		var num_files = 0; //keep count of number of files submitted
		var files_added = []; //this will be useful if I have to delete all the files

		var cb = function(err, data){ //handle most callbacks 
				console.log(err, data);
		}

		var cfg = { 
			headers: req.headers,

			limits: {
				files: 4
			}
		}; 
		var Busboy = require('busboy');
		busboy = new Busboy(cfg); //parses request for files and fields from form

		/* Store details of print job in a txt file */
		var fs = require('fs');
		fs.unlink('./info.txt', cb); //delete prexisting copy from other print job
		
		busboy.on('field', function(fieldname, val){ //add field data to txt file
			var field_data = fieldname + ': ' + val + '\n';
			fs.appendFile('./info.txt', field_data, cb);
		}); 

		/* Store form files in aws */
		busboy.on('file', function(fieldname, file, filename, encoding, mimetype){ 
			num_files++;
			files_added.push({ Key: filename });
			console.log('got file' + filename); 
			var params = {Bucket: time, Key: filename, Body: file}; 
			s3.upload(params, function(err, data){
	            if(err){
	            	res.render('error', {title: 'Error', message: 'sorry, shit happens'});
				res.end();
	            	//email me with error
	            	console.log(err);
	            }
	        });

		}); 

		busboy.on('finish', function(){ 
			console.log(num_files + files_added);
			if(num_files > 3){ //too many files
				console.log("got into check");
				var params = {
					Bucket: time,
					Delete: { Objects: files_added }
				};
				s3.deleteObjects(params, function(err, data) { //delete objects from folder
					if(err){
						//email me with error'
						console.log(err);
					}
					console.log("wow even im surprised this worked");
				});

				var params = { Bucket: time };
				s3.deleteBucket(params, function(err, data) { //delete folder
					if(err){
						//email me with error
						console.log(err);
					}
					console.log("wow even im surprised this worked");
				});


				res.render('error', { title: 'Error', message: 'too many files' });
				res.end();
			}
			else{
				var info = fs.createReadStream('./info.txt'); //create stream for file
				var params = {Bucket: time, Key: 'info.txt', Body: info};
				s3.upload(params, function(err, data){
		            if(err){
		            	console.log(err);

		            	res.render('error', {title: 'Error', message: 'sorry, shit happens'});
						res.end();
		            	//email me with error
		            }

		        });	

				res.end('done')
			}
		});	

		req.pipe(busboy); //pipe request to busboy
	}
}
exports.save_form = save_form;
