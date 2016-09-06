

# PerformanceView_Web



## Usage



## Developing

Remaining issue:
1. After click upload button: (How to transfer file name variable in index.js into index.ejs? DOM?)
	web will show uploaded file name after NAR file uploaded and prompted 'extracting NAR into csv' (progress Bar?)
	Prompt extract completed after csv ready 
2. Analyze button to parse csv
3. mongodb open / close issue? mongoose? we keep mongodb keep open now and do not close it after each insert.


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
		{SP : 'SPA'}, {Port : 'Port#'}
		...
		{SP : 'SPB'}, {Port : 'Port#'}
		...
	table 'APM00114301765_SPA_2015-08-07_00-38-02-GMT_M05-00_Rel_Pool-Luns'
		{Pool : 'Pool1 name'}, {Lun : 'Lun# name'}
		...
		{Pool : 'Pool2 name'}, {Lun : 'Lun# name'}
		...
	table 'APM00114301765_SPA_2015-08-07_00-38-02-GMT_M05-00_Rel_Pool-PRGs'
		{Pool : 'Pool1 name'}, {PRG : 'PRG# name'}
		...
		{Pool : 'Pool2 name'}, {PRG : 'PRG# name'}
		...
	table 'APM00114301765_SPA_2015-08-07_00-38-02-GMT_M05-00_Rel_PRG-Disks'
		{PRG : 'PRG1 name'}, {Disk : 'Disk# name'}
		...
		{PRG : 'PRG2 name'}, {Disk : 'Disk# name'}
		...


# MongoDB layout





### delete this
//./mongoimport -v -d morningstar -c yahoo_profile_info -f ticker_symbol,company_name,phone,fax,address,website,index_membership,sector,industry,full_time_employees --type csv --file /tmp/yahoo_profile_info.csv

commands:
mongoimport --db local --collection metrics --type=csv --headerline --file *.csv

>db.metrics.find({"Response Time (ms)": 9.952922})

### delete this




*** TODO List ***
- async control
	access mongodb to get config xml file need to use async control to get better code structure. 
	response for getjson need to use async control to return data to front end after we get data from mongodb

- change 'LUN' tab to 'FastCache' tab. Show fast cache disks/luns performance. Do not support RG luns now.

- support Fast Cache disks

- Add summary/threshold for typical performance metrics and give alert on page
	disk overload (different disk types)
	high response time
	high CPU utilization
	queue full ?
	....

- mongoose

- mongodb Map-Reduce

- easyUI Lazy Load Tree Node (what this could faster webpage load?)
- easyUI search box
- 

- Add known issue detection and alertion

- bugfix:
	select large configuration caused wrong result? dead loop?







*** TODO List ***

