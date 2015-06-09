/* This function renders the home page. */
var render_home = function(req, res){
	res.sendFile(require('path').join(__dirname, '/../views/home.html'));
}
exports.render_home = render_home;


/* This function saves form data in aws storage*/
var save_form = function(req, res){ 
	if(parseInt(req.headers['content-length'], 10) > (10 * 1024 * 1024)){ //10mb upload limit
		//render error in upload
		res.end('nope');
	}

	var fs = require('fs');

	var cfg = { 
		headers: req.headers	
	}; 
	var Busboy = require('busboy');
	busboy = new Busboy(cfg);

	var num_files = 0; //keep count of number of files submitted
	function max_files(){
		if(num_files > 10){ //too many files
			//delete bucket and contents
			//render error in upload
			res.end();
		}
	}

	var messUp = function(err, data){//in case fileWrite or unlink fails
			console.log(err, data);
	}

	/*create folder for print job*/
	var AWS = require('aws-sdk');
	AWS.config.loadFromPath('./aws-secret.json');
    var s3 = new AWS.S3();
    var time = new Date().getTime().toString();
    var params = { Bucket: time}; //name of folder to be created
    s3.createBucket(params, messUp);

	/* Store details of print job in a json */
	fs.unlink('./info.json', messUp); //delete prexisting copy from other print job

	fs.appendFile('./info.json', '{\n', messUp); //create json with opening curly brace
	
	busboy.on('field', function(fieldname, val){ //add form fields to json
		var dict_entry = '\t' + '"' + fieldname + '"'  + ': ' + '"' + val + '"' + '\n';
		fs.appendFile('./info.json', dict_entry, messUp);
	}); 

	/* Store form files in aws */
	/*busboy.on('file', function(fieldname, file, filename, encoding, mimetype){ 
		console.log('got file' + filename); 
		var params = {Bucket: time, Key: filename, Body: file}; 
		s3.upload(params, function(err, data){
                        console.log(err, data);
			num_files++;
			max_files();
                });

	}); */

	busboy.on('finish', function(){ 
		fs.appendFile('./info.json', '}', messUp); //close json with closing curly brace

		var json = fs.createReadStream('./info.json'); //create stream for file
		var params = {Bucket: time, Key: 'info.json', Body: json};
		s3.upload(params, messUp);	

		res.end('done')
	});	

	req.pipe(busboy); //pipe request to busboy
}
exports.save_form = save_form;
