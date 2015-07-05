/* This function returns data to populate the queue with */
var populate = function(req, res){
    res.setHeader('Content-Type', 'application/json');
	queue_data = {};

	var AWS = require('aws-sdk');
	AWS.config.loadFromPath(require('path').join(__dirname, '/../aws-secret.json'));
    var s3 = new AWS.S3();

    s3.listBuckets(function(err, data){
    	if(err){
        res.render('output', {title: 'Error', message: 'fucked up: send_res' + err});
    	}
      else if(data['Buckets'].length == 0){
          return res.send({});
      }

    	var fs = require('fs');
      var async = require('async');

      var all_params = [];
      for(var i = 0; i < data['Buckets'].length; i++){
          all_params.push({ Bucket: data['Buckets'][i]['Name'], Key: 'info.txt' });
      }

      function get_info(params, cb){
          s3.getObject(params, function(err, data){
              if(err){
                  console.log('fucked up info: ' + params['Bucket'] + err);
                  queue_data[params['Bucket']] = { name: 'n/a', ruid: 'n/a', email: 'n/a', notes: 'n/a' };
                  cb(null);
              }
              else{
                var tmp = './' + params['Bucket'] + '.txt';
                fs.appendFileSync(tmp, data['Body']);

                var info = fs.readFileSync(tmp, 'utf8').split('\n');
                queue_data[params['Bucket']] = { name: info[0], ruid: info[1], email: info[2], notes: info[3] };
                cb(null);
              }
          });
      }

      function send_res(err){
          if(err){
              console.log('fucked up: send_res' + err);
              res.render('output', {title: 'Error', message: 'fucked up: send_res' + err});
      				return res.end();
          }

          return res.send(queue_data);
      }

      async.each(all_params, get_info, send_res);
    });
}
exports.populate = populate;


/* This function removes a print job from the queue */
var delete_job = function(req, res){
    var AWS = require('aws-sdk');
    AWS.config.loadFromPath(require('path').join(__dirname, '/../aws-secret.json'));
    var s3 = new AWS.S3();
    var async = require('async');

    var params = { Bucket: req.params.id };

    s3.listObjects(params, function(err, data){
        if(err){
          res.render('output', {title: 'Error', message: 'fucked up: send_res' + err});
          return res.end();
        }

        if(data['contents'] == undefined){
          s3.deleteBucket(params, function(err, data){
              if(err){
                res.render('output', {title: 'Error', message: 'fucked up: send_res' + err});
                return res.end();
              }

              return res.send({});
          });
        }


        params['Delete'] = { Objects: [] };

        for(var i = 0; i < data['Contents'].length; i++){
            params['Delete']['Objects'].push( { Key: data['Contents'][i]['Key'] } );
        }

        s3.deleteObjects(params, function(err, data){
            if(err){
              res.render('output', {title: 'Error', message: 'fucked up: send_res' + err});
              return res.end();
            }

            delete params['Delete'];

            s3.deleteBucket(params, function(err, data){
                if(err){
                  res.render('output', {title: 'Error', message: 'fucked up: send_res' + err});
                  return res.end();
                }

                return res.end();
            });
        });
    });


}
exports.delete_job = delete_job;
