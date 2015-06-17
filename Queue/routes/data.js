/* This function returns data to populate the queue with */
var populate = function(req, res){
	queue_data = {};

	var AWS = require('aws-sdk');
	AWS.config.loadFromPath(require('path').join(__dirname, '/../aws-secret.json')); 
    var s3 = new AWS.S3();

    s3.listBuckets(function(err, data){
    	if(err){
    		//I should do something about it
    		return;
    	}

    	var fs = require('fs');
        var async = require('async');

        var all_params = [];
        for(var i = 0; i < data['Buckets'].length; i++){
            all_params.push({ Bucket: data['Buckets'][i]['Name'], Key: 'info.txt' });
        }

        function test(params, cb){
            s3.getObject(params, function(err, data){ 
                if(err){
                    console.log('fucked up: ' + err);
                    cb(err);
                }

                var tmp = './' + params['Bucket'] + '.txt';
                fs.appendFileSync(tmp, data['Body']);

                var info = fs.readFileSync(tmp, 'utf8').split('\n');
                queue_data[params['Bucket']] = { name: info[0], ruid: info[1], email: info[2], notes: info[3] };
                cb(null);
            });
        }

        function send_res(err){
            if(err){
                console.log('fucked up: ' + err);
                res.send({ });
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(queue_data);
        }

        async.each(all_params, test, send_res);
    });
}
exports.populate = populate;