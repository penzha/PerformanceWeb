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
				db.close();
				return callback(err);
			}
			
			console.log("db.collection find " + collectionName);
			
			collection.find().sort(['Poll Time', 1]);
			collection.find({"Object Name":"SP A"}, {"Poll Time":1, "Utilization (%)":1}).sort({"Poll Time":1}).toArray(function(err, docs) {
				db.close();

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
					nodeDispatch(node, basename, db);
				})

				console.log('read file finished');
				// mongodb.close();  // how to better handle open() and close() here. If we close DB here, insert will report mongo error because of async.
										// what about mongoose ?
										// current, we do not close mongodb anymore after it is opened.
										// one solution is to open db and close db each time when we insert doc. Seems ugly, any other option?
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

function nodeDispatch(node, basename, db) {
	var nodeType = getNodeType(node);

	switch (nodeType) {
		case 'SP': // SP
			console.log('find SP object');
			parseSP(node, basename, db);
			break;
		case 'Port': // SP -> Port
			console.log('find Port object in SP node');
			parsePort(node, basename, db);
			break;
		case 'Pool': // Pool
			console.log('find Pool object');
			parsePool(node, basename, db);
			break;
		case 'Thin LUN': // SP -> Thin LUN or Pool -> Thin LUN
			console.log('find Thin LUN object');
			parseThinLun(node, basename, db);
			break;
		case 'Private RAID Group': // Pool -> Private RAID Group
			console.log('find Private RAID Group object');
			parsePrivateRAIDGroup(node, basename, db);
			break;
		case 'Disk': // Pool -> Private RAID Group -> Disk
			console.log('find Disk object');
			parseDisk(node, basename, db);
			break;
		case 'Celerra Device': // Celerra Device
			console.log('find celerra device object');
			break;
		default:
			console.log('unsupported node: ', nodeType);
			break;
	}
}

function parseSP(spNode, basename, db) { //refactory parseSP() and parsePool() to parseParent()

	console.log('function parseSP');
	//console.log(node);

	var nodes = spNode.object;

	nodes.each(function(i, node) {
		nodeDispatch(node, basename, db);
	})

	console.log('parseSP finished');
}

function parsePool(poolNode,basename, db) {

	console.log('function parsePool');
	//console.log(node);

	var nodes = poolNode.object;

	nodes.each(function(i, node) {
		nodeDispatch(node, basename, db);
	})

	console.log('parsePool finished');
}

function parsePort(portNode, basename, db) {
	var parentName = getParentName(portNode);
	var portName = portNode.attributes().name;
	var SPPortTableName = basename + '_Rel_SP-Ports';
	console.log('parsePort(): parentName, portName, SPPortTableName - ', parentName, portName, SPPortTableName);

	db.collection(SPPortTableName, function(err, collection) {
		if (err) {
			console.log('parsePort - db.collection() failed - ', err);
			db.close();
			return;
		}

		//console.log('parsePort - collection: ', collection);
		collection.insertOne({'SP':parentName, 'Port':portName}, {w:1, j:true}, function(err, res) { // {w:1, j:true} has any effect here?
			if (err) {
				console.log('insert port failed - ', err);
				db.close();
				return;
			}
			console.log('Port collection.insertOne success');
		})
	})
}

function parseThinLun(thinlunNode, basename, db) {
	var parentType = getParentType(thinlunNode);
	var parentName = getParentName(thinlunNode);
	var lunName = thinlunNode.attributes().name;
	var PoolLunTableName = basename + '_Rel_Pool-Luns';
	console.log('parseThinLun(): parentName, lunName, PoolLunTableName - ', parentName, lunName, PoolLunTableName);

	if (parentType != 'Pool') {
		console.log('we do not parse thin lun object under this node: ', parentName);
		return;
	}

	db.collection(PoolLunTableName, function(err, collection) {
		if (err) {
			console.log('parseThinLun - db.collection() failed - ', err);
			db.close();
			return;
		}

		//console.log('parseThinLun - collection: ', collection);
		collection.insertOne({'Pool':parentName, 'Lun':lunName}, {w:1, j:true}, function(err, res) {
			if (err) {
				console.log('insert lun failed - ', err);
				db.close();
				return;
			}
			console.log('Lun collection.insertOne success');
		})
	})
}

function parsePrivateRAIDGroup(prgNode, basename, db) {
	var parentName = getParentName(prgNode);
	var prgName = prgNode.attributes().name;
	var PoolPRGTableName = basename + '_Rel_Pool-PRGs';
	console.log('parsePrivateRAIDGroup(): parentName, prgName, PoolPRGTableName - ', parentName, prgName, PoolPRGTableName);

	var nodes = prgNode.object;

	nodes.each(function(i, node) {
		nodeDispatch(node, basename, db);
	})

	db.collection(PoolPRGTableName, function(err, collection) {
		if (err) {
			console.log('parsePrivateRAIDGroup - db.collection() failed - ', err);
			db.close();
			return;
		}

		//console.log('parsePrivateRAIDGroup - collection: ', collection);
		collection.insertOne({'Pool':parentName, 'PRG':prgName}, {w:1, j:true}, function(err, res) {
			if (err) {
				console.log('insert PRG failed - ', err);
				db.close();
				return;
			}
			console.log('PRG collection.insertOne success');
		})
	})
}

function parseDisk(diskNode, basename, db) {
	var parentType = getParentType(diskNode);
	var parentName = getParentName(diskNode);
	var diskName = diskNode.attributes().name;
	var PRGDiskTableName = basename + '_Rel_PRG-Disks';
	console.log('parseDisk(): parentName, diskName, PRGDiskTableName', parentName, diskName, PRGDiskTableName);

	if (parentType != 'Private RAID Group') {
		console.log('we do not parse disk object under this node: ', parentName);
		return;
	}

	db.collection(PRGDiskTableName, function(err, collection) {
		if (err) {
			console.log('parseDisk - db.collection() failed - ', err);
			db.close();
			return;
		}

		//console.log('parseDisk - collection: ', collection);
		collection.insertOne({'PRG':parentName, 'Disk':diskName}, {w:1, j:true}, function(err, res) {
			if (err) {
				console.log('insert Disk failed - ', err);
				db.close();
				return;
			}
			console.log('Disk collection.insertOne success');
		})
	})
}


/***************************************************************************************************************************************************/
