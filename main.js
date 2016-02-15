var reader=require("./lib/reader.js");
var makeDb=require("./lib/db.js");
var writeGraphviz=require("./lib/graphvizWriter.js");


reader()
	.then(makeDb)
	.then(writeGraphviz({
		drawItemNodes: true
	}))
	.then(function(gv) {
		console.log(gv);
	})
	.catch(function(err) {
		console.error("Failed due to ",err,err.stack);
	});

