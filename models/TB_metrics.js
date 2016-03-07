// Performance Metrics
// do we need any model?

var mongodb = require('./db');
var path = require('path');

var execSync = require('child_process').execSync;

function Metrics(documents) {
	// define data here. do we need better data model here?
	//this.pollTime = metrics.pollTime;
	//this.utilization = metrics.utilization;
	this.documents = documents;
	
}

module.exports = Metrics;

// define function below
Metrics.importNAR = function (csvdir, csvfile, callback) {
	// import NAR csv file into MongoDB
	
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
	
		console.log("open mongodb ...");

		//import uploaded csv into MongoDB
		
		console.log("Importing NAR file: " + csvdir + csvfile);
		
		var collectionName = path.basename(csvfile, '.nar.csv');
	    var MongoImportCmd = 'mongoimport --db performanceviewer --collection ' + collectionName + ' --type=csv --headerline --file ' + csvdir + csvfile;
	    execSync(MongoImportCmd);  /// what about use async mode
	    console.log('Import NAR file completed.');
	    console.log('new collection name: ', collectionName);
	    
		
	    console.log("close mongodb ...");
	    mongodb.close();
	    //callback(err, metrics);
	    console.log("end of mongodb.open()");
	    
		callback();
	});	
};

Metrics.getSummary = function (csvfile, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
	
		console.log("open mongodb ...");
		
		var collectionName = path.basename(csvfile, '.nar');
		console.log("Search collection: ", collectionName);
		
		db.collection(collectionName, {strict:true}, function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			
			console.log("db.collection find " + collectionName);
			
			collection.find().sort(['Poll Time', 1]);
			collection.find({"Object Name":"SP A"}, {"Poll Time":1, "Utilization (%)":1}).sort({"Poll Time":1}).toArray(function(err, docs) {
				mongodb.close();

				console.log('find');
				console.log(docs);
				
				/*
				var polltime = JSON.stringify(docs, ["Poll Time"]);
				console.log(polltime.values());  //Chrome/IE do not support Object.values(obj) yet.
				*/
				
				if (docs) {
					var metrics = new Metrics(docs);
					callback(err, metrics);
					
				} else {
					callback(err, null);
				}
				

			});
			
			console.log('after collection.find()');
			
		});
		
		console.log('end of Metrics.getSummary');
	});
};
