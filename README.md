

# PerformanceView_Web



## Usage



## Developing

Remaining issue:
1. After click upload button: (How to transfer file name variable in index.js into index.ejs? DOM?)
	web will show uploaded file name after NAR file uploaded and prompted 'extracting NAR into csv' (progress Bar?)
	Prompt extract completed after csv ready 
2. Analyze button to parse csv
...


### Tools

Created with [Nodeclipse](https://github.com/Nodeclipse/nodeclipse-1)
 ([Eclipse Marketplace](http://marketplace.eclipse.org/content/nodeclipse), [site](http://www.nodeclipse.org))   

Nodeclipse is free open-source project that grows with your contributions.

# MongoDB layout
Example - APM00114301765_SPA_2015-08-07_00-38-02-GMT_M05-00.nar

1. NAR data
db 'performanceviewer' -> table 'APM00114301765_SPA_2015-08-07_00-38-02-GMT_M05-00' -> ...

2. NAR Relation
db 'performanceviewer' -> 
	table 'APM00114301765_SPA_2015-08-07_00-38-02-GMT_M05-00_Rel_SP-Ports'
		'SPA' : 'Port#'
		...
		'SPB' : 'Port#'
		...
	table 'APM00114301765_SPA_2015-08-07_00-38-02-GMT_M05-00_Rel_Pool-Luns'
		'Pool1 name' : 'Lun# name'
		...
		'Pool2 name' : 'Lun# name'
		...
	table 'APM00114301765_SPA_2015-08-07_00-38-02-GMT_M05-00_Rel_Pool-PRGs'
		'Pool1 name' : 'PRG# name'
		...
		'Pool2 name' : 'PRG# name'
		...
	table 'APM00114301765_SPA_2015-08-07_00-38-02-GMT_M05-00_Rel_PRG-Disks'
		'PRG1 name' : 'Disk# name'
		...
		'PRG2 name' : 'Disk# name'
		...


# MongoDB layout


### delete this
//./mongoimport -v -d morningstar -c yahoo_profile_info -f ticker_symbol,company_name,phone,fax,address,website,index_membership,sector,industry,full_time_employees --type csv --file /tmp/yahoo_profile_info.csv

commands:
mongoimport --db local --collection metrics --type=csv --headerline --file *.csv

>db.metrics.find({"Response Time (ms)": 9.952922})

### delete this