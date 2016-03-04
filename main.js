//var reader=require("./lib/reader.js");
//var makeDb=require("./lib/db.js");
//var writeGraphviz=require("./lib/graphvizWriter.js");
var writeJson=require("./lib/jsonWriter.js");


//reader()
//	.then(makeDb)
//	.then(writeGraphviz({
//		drawItemNodes: true
//	}))
//	.then(function(gv) {
//		console.log(gv);
//	})
var readXml=require("./lib/dataXmlReader.js");
var linkData=require("./lib/dataLinker.js");
var enrichData=require("./lib/dataEnricher.js");
var Database=require("./lib/database.js");

var db=new Database();

readXml(db,"./xmlFiles")
	.then(function() {
		return Promise.all([
			linkData(db),
			enrichData(db)
		]);
	})
	.then(function() {
		return writeJson(db,{outputDir: "html/"});
	})
	.catch(function(err) {
		console.error("Failed due to ",err,err.stack);
	});

