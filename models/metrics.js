// Performance Metrics
// do we need any model?

var mongodb = require('./db');
var path = require('path');

var xmlreader = require('xmlreader');
var fs = require('fs');

var execSync = require('child_process').execSync;

function Metrics(documents) {
	// define data here. do we need better data model here?
	//this.pollTime = metrics.pollTime;
	//this.utilization = metrics.utilization;
	this.documents = documents;
	
}

module.exports = Metrics;

/***************************************************************************************************************************************************/

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

/***************************************************************************************************************************************************/

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
				
				//var polltime = JSON.stringify(docs, ["Poll Time"]);
				//console.log(polltime.values());  //Chrome/IE do not support Object.values(obj) yet.
				
				if (docs) {
					var metrics = new Metrics(docs);
					return callback(err, metrics);
					
				} else {
					return callback(err, null);
				}
				

			});
			
			console.log('after collection.find()');
			
		});
		
		console.log('end of Metrics.getSummary');
	});
};

/***************************************************************************************************************************************************/

// Parse XML file and save relationship into mongodb.
// Check README.md for relationship layout in MongoDB
Metrics.ParseXMLAndSaveToDB = function (relXMLFile, callback) {  //move this into metrics.js
	console.log('--- Parse XML start - rel');

	fs.readFile(relXMLFile, 'utf8', function (err, data) {
		//console.log(data);

		xmlreader.read(data, function (err, res) {
			if (err) {
				return callback(err);
			}

			console.log(res);
			console.log(res.archivedump.archivefile.object.object.at(1).attributes().type);

			console.log('read xml successful');

			// get ports
			var nodes = res.archivedump.archivefile.object.object;
			var basename = path.basename(relXMLFile, '.nar.rel.xml');
			console.log('basename: ', basename);

			mongodb.open(function(err, db) {
				if (err) {
					console.log('mongodb open failed ---', err);
					return callback(err);
				}

				console.log('mongodb open ---');

				nodes.each(function(i, node) {
					nodeDispatch(node, basename);
				})

				console.log('read file finished');
				mongodb.close();
				console.log('mongodb closed');

				return callback(null);
			})
		})
	})
}

function getNodeName(node) {
	var name = node.attributes().name;
	return name;
}

function getNodeType(node) {
	var type = node.attributes().type;
	return type;
}

function getParentName(node) {
	var name = node.parent().attributes().name;
	return name;
}

function getParentType(node) {
	var type = node.parent().attributes().type;
	return type;
}

function nodeDispatch(node, basename) {
	var nodeType = getNodeType(node);

	switch (nodeType) {
		case 'SP': // SP
			console.log('find SP object');
			parseSP(node, basename);
			break;
		case 'Port': // SP -> Port
			console.log('find Port object in SP node');
			parsePort(node, basename);
			// parse port
			break;
		case 'Pool': // Pool
			console.log('find Pool object');
			parsePool(node, basename);
			break;
		case 'Thin LUN': // SP -> Thin LUN or Pool -> Thin LUN
			console.log('find Thin LUN object');
			parseThinLUN(node, basename);
			break;
		case 'Private RAID Group': // Pool -> Private RAID Group
			console.log('find Private RAID Group object');
			parsePrivateRAIDGroup(node, basename);
			break;
		case 'Disk': // Pool -> Private RAID Group -> Disk
			console.log('find Disk object');
			parseDisk(node, basename);
			break;
		case 'Celerra Device': // Celerra Device
			console.log('find celerra device object');
			break;
		default:
			console.log('unsupported node: ', nodeType);
			break;
	}
}

function parseSP(spNode, basename) { //refactory parseSP() and parsePool() to parseParent()

	console.log('function parseSP');
	//console.log(node);

	var nodes = spNode.object;

	nodes.each(function(i, node) {
		nodeDispatch(node, basename);
	})

	console.log('parseSP finished');
}

function parsePool(poolNode,basename) {

	console.log('function parsePool');
	//console.log(node);

	var nodes = poolNode.object;

	nodes.each(function(i, node) {
		nodeDispatch(node, basename);
	})

	console.log('parsePool finished');
}

function parsePort(portNode, basename) {
	console.log('function parsePort');

	var parentName = getParentName(portNode);
	console.log('Port parent name: ', parentName);

	//insert SP-Port into DB
	var SPPortTableName = basename + '_Rel_SP-Ports';
	console.log('SPPortTableName: ', SPPortTableName);

}

function parseDisk(diskNode, basename) {
	console.log('function parseDisk');

	var parentType = getParentType(diskNode);
	var parentName = getParentName(diskNode);

	if (parentType != 'Private RAID Group') {
		console.log('we do not parse disk object under this node: ', parentName);
		return;
	}

	//insert Private RAID Group - Disk into DB
	var PRGDiskTableName = basename + '_Rel_PRG-Disks';
	console.log('PRGDiskTableName: ', PRGDiskTableName);

}

function parseThinLUN(thinlunNode, basename) {
	console.log('function parseThinLUN');

	var parentType = getParentType(thinlunNode);
	var parentName = getParentName(thinlunNode);
	if (parentType != 'Pool') {
		console.log('we do not parse thin lun object under this node: ', parentName);
		return;
	}

	//insert Pool - thin lun into DB
	var PoolLunTableName = basename + '_Rel_Pool-Luns';
	console.log('PoolLunTableName: ', PoolLunTableName);

}

function parsePrivateRAIDGroup(prgNode, basename) {
	console.log('function parsePrivateRAIDGroup');

	var parentName = getParentName(prgNode);
	console.log('PRG parent name: ', parentName);

	var nodes = prgNode.object;

	nodes.each(function(i, node) {
		nodeDispatch(node, basename);
	})

	console.log('parsePRG finished');

	//insert Pool - Private RAID Group into DB
	var PoolPRGTableName = basename + '_Rel_Pool-PRGs';
	console.log('PoolPRGTableName: ', PoolPRGTableName);

}

/***************************************************************************************************************************************************/
