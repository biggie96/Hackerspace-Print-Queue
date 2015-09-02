/* This function returns data to populate the queue with */
var populate = function(req, res){
  res.setHeader('Content-Type', 'application/json');

  /* holds data on all print jobs in the queue */
	queue_data = {};

  //setup parse
  var Parse = require('parse').Parse;
  Parse.initialize("0rEzgPPAwytqrJSqzmNgHlErv6bnV9urmcMYmQf9", "gucaNYqC7tM5mSwb48LY4KeQN5JpafxhWBq81ID0");
  var PrintInfo = Parse.Object.extend("PrintInfo");

  //get all the prints
  var query = new Parse.Query(PrintInfo);
  query.find({

    success: function(results){
      for(var i = 0; i < results.length; i++){
        var print = results[i];
        queue_data[print.get("folderName")] = { name: print.get("name"),
          ruid: print.get("netID"),
          email: print.get("email"),
          notes: print.get("notes"),
          color: print.get("color")
        };
      }

      send_res(null);
    },

    error: function(error){
      console.log(error);
      send_res(error);
    }

  });

  function send_res(err){
      if(err){
          console.log('@send_res: ' + err);
          res.render('output', {title: 'Error', message: 'Sorry, an error has occured. Please try again.'});
          return res.end();
      }

      return res.send(queue_data);
  }
}
exports.populate = populate;


/* This function removes a print job from the queue */
var remove_job = function(req, res){
    /* configure aws */
    var AWS = require('aws-sdk');
    AWS.config.loadFromPath(require('path').join(__dirname, '/../aws-secret.json'));
    var s3 = new AWS.S3();

    /* Delete */
    //remove from parse
    //setup parse
    var Parse = require('parse').Parse;
    Parse.initialize("0rEzgPPAwytqrJSqzmNgHlErv6bnV9urmcMYmQf9", "gucaNYqC7tM5mSwb48LY4KeQN5JpafxhWBq81ID0");
    var PrintInfo = Parse.Object.extend("PrintInfo");
    //get the print to remove
	var query = new Parse.Query(PrintInfo);
    query.equalTo("folderName", req.query.id);
	query.find({
	    success: function(results){
		    results[0].destroy({
		        success: function(object){
 			        console.log("deleted from parse");
			    },

			    error: function(object, error){
			        console.log("didnt delete from parse");
			    }
		    });
		},
		
		error: function(error){
		    console.log("no bullets, cant do it:" + error.message);
		}
	});

    var params = { Bucket: req.query.id };
    s3.listObjects(params, function(err, data){
        if(err){
          console.log('@listObjects: ' + err);
          res.render('output', {title: 'Error', message: 'Sorry, an error has occured. Please try again.'});
          return;
        }

        if(data['contents'] == undefined){
          s3.deleteBucket(params, function(err, data){
              if(err){
                console.log('@deleteBucket: ' + err);
                res.render('output', {title: 'Error', message: 'Sorry, an error has occured. Please try again.'});
                return;
              }
              return res.end();
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

      /* zip-stream doesn't allow concurrent archiving of files or the
      * calling of archive.entry with multiple files
      * so to get around that, this recursive function starts
      * with the first file and calls itself with
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
