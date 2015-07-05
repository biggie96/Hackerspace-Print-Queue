/* This function streams a .zip of the print job to the browser */
var download =  function(req, res){
  var zip = require('express-zip');
  var fs = require('fs');
  var async = require('async');
  var AWS = require('aws-sdk');
  AWS.config.loadFromPath(require('path').join(__dirname, '/../aws-secret.json'));
  var s3 = new AWS.S3();

  var params = { Bucket: req.params.id };
  s3.listObjects(params, zipfiles);

  function zipfiles(err, data){
    var filenames = [];
    for(var i = 0; i < data['Contents'].length; i++){
        filenames.push({Bucket: req.params.id, Key: data['Contents'][i]['Key']});
    }

    async.map(filenames, getFile, sendzip);

    function getFile(filename, cb){
      s3.getObject(filename, function(err, data){
          if(err){
              console.log('fucked up info: ' + err);
              cb(err, null);
          }
          else{
            cb(null, {stream: data['Body'], name: filename['Key']});
          }
      });
    }

    function sendzip(err, all_files){
      if(err){
        //do something
      }

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
          //do something
        }

        res.zip(file_paths);
      }

    }
  }
}
exports.download = download;

/* Used for debugging */
var test = function(req, res){
  var fs = require('fs');
  /*var fs = require('fs');
  var archiver = require('archiver');
  var archive = archiver('zip');

  res.on('close', function() {
    console.log('Archive wrote %d bytes', archive.pointer());
    return res.status(200).send('OK').end();
  });

  res.attachment('archive-name.zip');
   archive.pipe(res);
   archive.append(fs.createReadStream('./info.txt'), { name: 'yp' });
   console.log('made it');
   archive.finalize();*/
   res.download('./1436037938088.txt');
   console.log('yo');
   res.attachment('info.txt');
   fs.createReadStream('./info.txt', function(err, data){ data.pipe(res)});

}
exports.test = test;
