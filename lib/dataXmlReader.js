var fs = require('fs');
var xml2js = require('xml2js');
var toArray=require("./toArray.js");

function readFile(filename) {
	return new Promise(function(resolve,reject) {
		var xml = fs.readFileSync(filename, "utf8");
		xml2js.parseString(xml,{explicitArray:false,trim:true,mergeAttrs:true}, function (err, result) {
			if(err) {
				reject(err);
			} else {
				resolve(result);	
			}
		});
	});
}

var findXmlFiles=function(dir) {
	return fs.readdirSync(dir).reduce(function(acc,f) {
		var filename=dir+"/"+f;
		if(fs.lstatSync(filename).isDirectory()) {
			return acc.concat(findXmlFiles(filename));
		}
		else if(f.match(/.xml$/i)) {
			return acc.concat(filename);
		} else { 
			return acc;
		}
	},[]);
};
module.exports=function(db,path) {
	path=path || "./xmlfiles/";
	
	return readFile(path+"/research.xml")
	.then(function(data) {
		data.ArrayOfResearchDataEntry.ResearchDataEntry.forEach(function(r) {
			db.insertResearch(r);
		});
	}).then(function() {
		return readFile(path+"/TerrainData.xml")
	}).then(function(data) {
		data.ArrayOfTerrainDataEntry.TerrainDataEntry.forEach(function(r) {
			db.insertTerrain(r);
		});
	}).then(function() {
		return 	Promise.all(findXmlFiles(path).map(function(filename) {
			return readFile(filename).then(function(data) {
				var recipes=[];
				var craftStation="unknown";
				if(data.ArrayOfCraftData && data.ArrayOfCraftData.CraftData) {
					recipes=toArray(data.ArrayOfCraftData.CraftData);
					var m=/(\w+)Recipes\.xml$/.exec(filename) || /GenericAutoCrafter\/(\w+)\.xml$/.exec(filename);
					if(m) {
						craftStation=m[1];
					}					
				}
				if(data.GenericAutoCrafterDataEntry) {
					recipes=toArray(data.GenericAutoCrafterDataEntry.Recipe);
					craftStation=data.GenericAutoCrafterDataEntry.FriendlyName;
					
					// TODO: Grab the autocrafter stats and create an entry for it
				}
				
				recipes.forEach(function(r) {
					r.craftStation=r.CanCraftAnywhere?"By Hand":craftStation;
					r.sourceFile=filename;
					db.insertRecipe(r);
				});
			});
		}));
	});
};