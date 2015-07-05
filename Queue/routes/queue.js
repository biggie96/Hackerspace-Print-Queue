/* This function returns data to populate the queue with */
var populate = function(req, res){
  res.setHeader('Content-Type', 'application/json');

  /* holds data on all print jobs in the queue */
	queue_data = {};

  /* configure aws */
	var AWS = require('aws-sdk');
	AWS.config.loadFromPath(require('path').join(__dirname, '/../aws-secret.json'));
  var s3 = new AWS.S3();

  /* Load all print jobs
  * Theres probably a better way to structure this with less nesting, but I don't know it
  */
  s3.listBuckets(function(err, data){ //gets folders for each print
  	if(err){
      res.render('output', {title: 'Error', message: 'Sorry, an error has occured. Please try again.'});
      console.log('@listBuckets: ' + err);
      return res.end();
  	}
    else if(data['Buckets'].length == 0){ // no prints
        return res.send({});
    }

    /* much needed modules */
  	var fs = require('fs');
    var async = require('async');

    /* params to get the info.txt for each print from aws*/
    var all_params = [];
    for(var i = 0; i < data['Buckets'].length; i++){ //loop through prints
        all_params.push({ Bucket: data['Buckets'][i]['Name'], Key: 'info.txt' });
    }

    /* get info for each print and then send it back to the client */
    async.each(all_params, get_info, send_res);

    function get_info(params, cb){
        s3.getObject(params, function(err, data){
            if(err){ //this folder does not contain a print, but I'll list it anyway
                console.log('@get_info: ' + err);
                queue_data[params['Bucket']] = { name: 'n/a', ruid: 'n/a', email: 'n/a', notes: 'n/a' };
                cb(null);
            }
            else{
              /* save info.txt locally so I can read from it */
              var tmp = './' + params['Bucket'] + '.txt';
              fs.appendFileSync(tmp, data['Body']);

              /* Add info to data to be returned to client */
              var info = fs.readFileSync(tmp, 'utf8').split('\n');
              queue_data[params['Bucket']] = { name: info[0], ruid: info[1], email: info[2], notes: info[3] };
              cb(null);
            }
        });
    }

    function send_res(err){
        if(err){
            console.log('@send_res: ' + err);
            res.render('output', {title: 'Error', message: 'Sorry, an error has occured. Please try again.'});
    				return res.end();
        }

        return res.send(queue_data);
    }
  });
}
exports.populate = populate;


/* This function removes a print  job from the queue */
var remove_job = function(req, res){
    /* configure aws */
    var AWS = require('aws-sdk');
    AWS.config.loadFromPath(require('path').join(__dirname, '/../aws-secret.json'));
    var s3 = new AWS.S3();

    var async = require('async'); //for asynchronous things

    /* You cant remove entire folders from aws so I list all the files
    * delete them one by one, and then delete the empty folder
    */
    var params = { Bucket: req.query.id };
    s3.listObjects(params, function(err, data){
        if(err){
          console.log('@listObjects: ' + err);
          res.render('output', {title: 'Error', message: 'Sorry, an error has occured. Please try again.'});
          return res.end();
        }

        if(data['contents'] == undefined){
          s3.deleteBucket(params, function(err, data){
              if(err){
                console.log('@deleteBucket: ' + err);
                res.render('output', {title: 'Error', message: 'Sorry, an error has occured. Please try again.'});
                return res.end();
              }

              return res.send({});
          });
        }

        /* get params to delete all files from folder */
        params['Delete'] = { Objects: [] };
        for(var i = 0; i < data['Contents'].length; i++){
            params['Delete']['Objects'].push( { Key: data['Contents'][i]['Key'] } );
        }

        s3.deleteObjects(params, function(err, data){
            if(err){
              console.log('@deleteObjects: ' + err);
              res.render('output', {title: 'Error', message: 'Sorry, an error has occured. Please try again.'});
              return res.end();
            }

            delete params['Delete']; //remove 'delete' key so that I can use params to remove the folder
            s3.deleteBucket(params, function(err, data){
                if(err){
                  console.log('@deleteBucket: ' + err);
                  res.render('output', {title: 'Error', message: 'Sorry, an error has occured. Please try again.'});
                }
                return res.end();
            });
        });
    });
}
exports.remove_job = remove_job;


/* This function notifies the recipent that their print is completed */
var notify = function(req, res){
  var fs = require('fs');

  /* configure sendgrid */
  var credentials = fs.readFileSync('./sendgrid-api.cfg', 'utf8').split('\n'); //get sendgrid info
  var sendgrid = require('sendgrid')(credentials[0], credentials[1]);

  /* Get body of email */
  var to = req.query.email;
  var sender = 'mcgrew@cs.rutgers.edu';
  var subject = 'Hackerspace Print Completed!';
  var text = 'Hello ' + req.query.name + ', your print is finished! Please come pick it up at your earliest convenience.';

  /* send email */
  sendgrid.send({
  to:       to,
  from:     sender,
  subject:  subject,
  text:     text
  }, function(err, json) {
    if (err) {
       console.error('@sendgrid: ' + err);
       return res.end();
    }
    console.log('@sendgrid: ' + json);
    res.end();
  });
}
exports.notify = notify;


/* This function streams a .zip of the print job to the browser */
var nah =  function(req, res){
  var zip = require('express-zip');
  var fs = require('fs');
  var async = require('async');
  //configure aws
  var AWS = require('aws-sdk');
  AWS.config.loadFromPath(require('path').join(__dirname, '/../aws-secret.json'));
  var s3 = new AWS.S3();

  /* get list of all files */
  var params = { Bucket: req.query.id };
  s3.listObjects(params, zipfiles);

  function zipfiles(err, data){
    /* get params for all files */
    var filenames = [];
    for(var i = 0; i < data['Contents'].length; i++){
        filenames.push({Bucket: req.query.id, Key: data['Contents'][i]['Key']});
    }

    /* this map gets a readable stream for each files and sends them to be zipped */
    async.map(filenames, getFile, sendzip);

    function getFile(filename, cb){
      s3.getObject(filename, function(err, data){
          if(err){
              console.log('@getFile/getObject: ' + err);
              cb(err, null);
          }
          else{
            cb(null, {stream: data['Body'], name: filename['Key']});
          }
      });
    }

    function sendzip(err, all_files){
      if(err){
        console.log('@sendzip: ' + err);
      }

      /* this map saves all files locally so that they can be zipped and downloaded by the client */
      async.map(all_files, save_to_disk, send);

      function save_to_disk(file, cb){
        fs.appendFile('./' + file['name'], file['stream'], function(err, data){
          if(err){
            cb(err);
          }
          else{
            cb(null, {path: './' + file['name'], name: file['name']});
          }
        });
      }

      function send(err, file_paths){
        if(err){
          console.log('@sendzip-send: ' + err);
        }
        res.zip(file_paths); //send zip file to client for download
        console.log('and theeeeen');

        /* get rid of the files locally */
        for(var i = 0; i < file_paths.length; i++){
          file = file_paths[i];
          console.log(file);
          fs.unlink(file['path'], function(err, data){
            if(err){
              console.log('@send-unlink: ' + err);
            }
          });
        }
      }
    }
  }
}
//exports.download = download;

/* This function streams a .zip of the print job to the browser */
var download =  function(req, res){
  /* configure zip-stream */
  var packer = require('zip-stream');
  var archive = new packer();

  /* configure aws */
  var AWS = require('aws-sdk');
  AWS.config.loadFromPath(require('path').join(__dirname, '/../aws-secret.json'));
  var s3 = new AWS.S3();

  var fs = require('fs');
  var async = require('async');

  /* get list of all files */
  var params = { Bucket: req.query.id };
  s3.listObjects(params, zipfiles);

  function zipfiles(err, data){
    /* get params to get readable streams for all files */
    var filenames = [];
    for(var i = 0; i < data['Contents'].length; i++){
        filenames.push({Bucket: req.query.id, Key: data['Contents'][i]['Key']});
    }

    /* this map gets a list readable stream for each file and the list is then zipped
    * and sent to the client
    */
    async.map(filenames, getFile, sendzip);

    function getFile(filename, cb){
      s3.getObject(filename, function(err, data){
          if(err){
              console.log('@getFile/getObject: ' + err);
              cb(err, null);
          }
          else{
            cb(null, {stream: data['Body'], name: filename['Key']});
          }
      });
    }

    function sendzip(err, all_files){
      if(err){
        console.log('@sendzip: ' + err);
      }

      archive.pipe(res); //stream .zip to client

      /* zip-stream doesn't allow concurrent archiving of files
      * so to get around that, I call this recursive function with
      * the next file once the previous one is completed.
      * When they are all done, the archive gets finalized
      */
      (function zip(i){
        if(i < all_files.length){
          archive.entry(all_files[i]['stream'], { name: all_files[i]['name'] }, function(err, entry){
            if(err){
              console.log('@zip: ' + err);
            }
            i = i + 1;
            zip(i); //next file
          });
        }
        else{
          archive.finish(); //finalize archive
        }
      })(0);
    }
  }
}
exports.download = download;
