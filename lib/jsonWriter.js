var fs=require("fs");

module.exports=function(db,options) {
	options=options || {};
	var outputDir=options.outputDir || "./";

	fs.writeFileSync(outputDir+"fceDatabase.js","var fceDatabase="+JSON.stringify({
		"recipes": db.allRecipes,
		"research": db.allResearch,
		"terrain": db.allTerrain
	},null,2)+";");
};