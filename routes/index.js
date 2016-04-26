var express = require('express');
var	router = express.Router();
var	formidable = require('formidable');
var fs = require('fs');
var Metrics = require('../models/metrics.js');

var exec = require('child_process').exec;
//var execSync = require('child_process').execSync;  // better to use exec. 1.show 'analyzing' before naviseccli complete. 2. show 'analyzed' in callback 

var xml2js = require('xml2js');



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var TITLE = 'Performance Viewer';

var uploadFileName;  //use global variable is not a good way here. Multiple user upload different files in near timemay conflict each other.
// how to send file name to /metrics after save to db complete and redirect to /metrics????
// maybe we need to store data in *session* in order to use it in another page (/metrics) ??

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: TITLE });
});

router.post('/', function(req, res) {
  var form = new formidable.IncomingForm();  // create upload form
  form.encoding = 'utf-8';
  form.uploadDir = "/var/tmp/";
  form.keepExtensions = true;
  
  console.log('--- upload NAR file start');

  console.log(__dirname); // for test

  form.parse(req, function(err, fields, files) {
    if (err) {
      res.locals.error = err;
      res.render('index', { title: TITLE });
      return;		
    }  
        
  if (files.narFile.size > 0) {
  	uploadFileName = files.narFile.name;
	var narFilePath = form.uploadDir + uploadFileName;

	// check whether the uploaded NAR file already exist. We use fs.stat() here because fs.exists already deprecated
	// fs.exists(narFilePath, function(exists) {
	//	if (exists) {
	fs.stat(narFilePath, function(err, stats) {
	    if (!err) {
	    	console.log("The upload NAR file already exist");
	    		
	    	fs.renameSync(files.narFile.path, narFilePath);  //just to avoid leave a temp file in the folder
	    	    
	    	//req.flash('error', 'The upload NAR file already exist'); //?? not works
	        //return res.redirect('/');
	    	res.locals.success = 'The upload NAR file already exist';
	    	res.render('index', { title: TITLE}); 
	    } else {
	    	fs.renameSync(files.narFile.path, narFilePath);  //rename
	    	console.log('--- upload NAR file complete');
	    	    
	    	GenerateDataToDB(form, narFilePath, uploadFileName, function (err) {
	    		if (err) {
	    			res.locals.error = err;
	    			//return res.redirect('/');
	    			return;
	    		}

	    		console.log('import data CSV successful');

	    		GenerateRelToDB(form, narFilePath, uploadFileName, function(err) {
	    			if (err) {
	    				res.locals.error = err;
	    				//return res.redirect('/');
	    				return;
	    			}

    				console.log('Save Rel XML into mongodb successful');

	    			res.locals.success = 'Upload and Analyze Successful';
	   	    		res.render('index', { title: TITLE}); //?? how to make 'Analyze' button change from gray to ready here?
	    		})

	    	})
	    	    //res.locals.success = 'Upload Successful';
	    	    //res.render('index', { title: TITLE});  //this execute first before naviseccli completed, what about use exec() ??
	    	}
	    });
	    

    } else {
    	//req.flash('error', 'Please select a NAR file'); //?? not works
    	//return res.redirect('/');
    	
    	res.locals.success = 'Please select a NAR file';
    	res.render('index', { title: TITLE}); //?? how to make 'Analyze' button change from gray to ready here?

    }
  })
})

router.get('/metrics', function(req, res) {
	// add logic
	//Metrics.getSummary(uploadFileName, function(err, narSummary) {
	Metrics.getElements(uploadFileName, function(err, narSummary) {	
		if (err) {
            		//??
            		console.log("getSummary from talbe " + uploadFileName + " failed");
            		return res.redirect('/');
            	}

		console.log('index.js - getSummary callback() ...');
	
		// use data model here?
		var pollTime = [];
		var utilization = [];
		var sptree = narSummary.spjson;
		var pooltree = narSummary.pooljson;
		var luntree = narSummary.lunjson;

		//console.log("index.js - sptree: ", sptree);

		/*
		for (var i = 0; i < narSummary.documents.length; i++) {
			console.log('Poll Time[]: ' + narSummary.documents[i]["Poll Time"]);
			console.log('utilization[]: ' + narSummary.documents[i]["Utilization (%)"]);

			pollTime.push(narSummary.documents[i]["Poll Time"]);
			utilization.push(narSummary.documents[i]["Utilization (%)"]);
		}
		console.log("=========\n");
		console.log(pollTime);
		console.log(utilization);
		*/
		return res.render('metrics', { title: uploadFileName, Sptree: sptree, Pooltree:pooltree, Luntree:luntree, Pooltree:pooltree, PollTime: pollTime, Utilization: utilization});
		//return res.render('metrics', { title: "Metrics View!!!"});

	});

	console.log('end of /metrics get');
});

router.post('/metrics', function(req, res) {
	console.log("metrics post");
});

router.get('/TB', function(req, res) {
	  res.render('TB', { title: "Thunderbird Metrics view" });
	});

router.post('/TB', function(req, res) {
  var form = new formidable.IncomingForm();  // create upload form
  form.encoding = 'utf-8';
  form.uploadDir = "/var/tmp/";
  form.keepExtensions = true;
  
  console.log('--- upload SQLite archive file start');

  console.log(__dirname); // for test

  form.parse(req, function(err, fields, files) {
    if (err) {
      res.locals.error = err;
      res.render('index', { title: TITLE });
      return;		
    }  
        
    if (files.sqlite.size > 0) {
	    var sqlitePath = form.uploadDir + files.sqlite.name;
	
	    // check whether the uploaded NAR file already exist. We use fs.stat() here because fs.exists already deprecated
	    //fs.exists(sqlitePath, function(exists) {
	    //	if (exists) {
	    fs.stat(sqlitePath, function(err, stats) {
	    	if (!err) {
	    		console.log("The upload SQLite file already exist");
	    		
	    	    uploadFileName = files.sqlite.name;
	    	    fs.renameSync(files.sqlite.path, sqlitePath);  //just to avoid leave a temp file in the folder
	    	    
	    		//req.flash('error', 'The upload NAR file already exist'); //?? not works
	        	//return res.redirect('/');
	    		res.locals.success = 'The upload SQLite file already exist';
	    		res.render('index', { title: TITLE}); 
	    	} else {
	    	    fs.renameSync(files.sqlite.path, sqlitePath);  //rename
	    	    console.log('--- upload SQLite file complete');
	    	    
	    	    uploadFileName = files.sqlite.name;
	    	    
	    	    res.locals.success = 'Upload SQLite archive file Successful';
	    	    res.render('index', { title: TITLE});  //this execute first before naviseccli completed, what about use exec() ??
	    	}
	    });
	    

    } else {
    	//req.flash('error', 'Please select a NAR file'); //?? not works
    	//return res.redirect('/');
    	
    	res.locals.success = 'Please select a SQLite file';
    	res.render('index', { title: TITLE}); //?? how to make 'Analyze' button change from gray to ready here?

    }
  });

  console.log('---- 33333');
});

router.get('/changelog', function(req, res) {
	  res.render('changelog', { title: "ChangeLog" });
	});

router.get('/analyzing', function(req, res) {
	  res.render('analyzing', { title: "analyzing" });
	});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// generate data csv file from NAR file and save into mongodb
function GenerateDataToDB(form, narFilePath, uploadFileName, callback) {
	console.log('--- Convert NAR to CSV start - data');

	var dataCmd = 'naviseccli -messner analyzer -archivedump -data ' + narFilePath + ' -out ' + form.uploadDir + uploadFileName + '.csv';
	exec(dataCmd, function(err, stdout, stderr){ // Async mode
		if (err) {
	   	    console.log('run naviseccli error:' + stderr);
	   	    return callback(err);
	   	} else {
	   	    console.log('--- Convert NAR to CSV complete - data');
	   	    console.log('importing CSV into mongodb......');
	   	    
	   	    Metrics.importNAR(form.uploadDir, uploadFileName + '.csv', function(err) {
	   	    	if (err) {
	   	    		console.log('import CSV failed');
	   	   			res.locals.error = 'Upload and Analyze data csv failed';
	   	    		return callback(err);
	   	    	}
	   	    	console.log('import data CSV successful');

	   	    	return callback(err);
	   	    	
	   	    	//req.flash('info', 'Analyze completed'); //??
	   	    	//res.redir	
	   	    	//res.locals.success = 'Upload and Analyze Successful';
	   	    	//res.render('index', { title: TITLE}); //?? how to make 'Analyze' button change from gray to ready here?
	   	    })
	   	}
	})

	// generate csv file from NAR file, Sync mode
	/*
	console.log('--- Convert NAR to CSV start');
	var testCmd = 'naviseccli -messner analyzer -archivedump -data ' + narFilePath + ' -out ' + form.uploadDir + files.narFile.name + '.csv';
	execSync(testCmd);  /// what about use async mode and save csv into mongodb in exec callback
	console.log('--- Convert NAR to CSV complete');
	
	console.log('--- Save CSV data into MongoDB start');
	
	console.log('--- Save CSV data into MongoDB complete');
	*/
}

// generate relationship XML file. 
function GenerateRelToDB(form, narFilePath, uploadFileName, callback) {    
    console.log('--- Convert NAR to XML start - rel');
	    	    
	var relCmd = 'naviseccli -messner analyzer -archivedump -rel ' + narFilePath + ' -out ' + form.uploadDir + uploadFileName + '.rel.xml' + ' -xml';
	exec(relCmd, function(err, stdout, stderr) {
	    if (err) {
	    	console.log('run naviseccli error:' + stderr)
	    	return callback(err);
	    } else {
	    	console.log('--- Convert NAR to XML complete - rel');
	    	var relXMLFile = form.uploadDir + uploadFileName + '.rel.xml';
	    	console.log('XML file: ', relXMLFile);

	    	Metrics.ParseXMLAndSaveToDB(relXMLFile, function(err) {
	    		if (err) {
	   	    		console.log('Parse XML and Save to DB failed');
	   	    		return callback(err);
	   	    	}
	   	    	console.log('Parse XML and Save to DB successful');
	   	    	return callback(err);
	    	})
		}
	})
}



module.exports = router;