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

function readRecipeSetFile(recipeSet,path) {
	return readFile(path+recipeSet.FileName).then(function(data) {
		var recipes=toArray(data.ArrayOfCraftData && data.ArrayOfCraftData.CraftData);

		return recipes.map(function(r) {
			r.craftStation=recipeSet.MachineKey;
			r.sourceFile=recipeSet.FileName;
			return r;
		});
	});
};

function readGacFile(filename) {
	return readFile(filename).then(function(data) {
		var recipes=toArray(data.GenericAutoCrafterDataEntry.Recipe);;

		return recipes.map(function(r) {
			r.craftStation=data.GenericAutoCrafterDataEntry.Value;
			r.sourceFile=filename;
			return r;
		});
	});
};

module.exports=function(path) {
	path=path || "./xmlfiles/";
	var db={};
	return readFile(path+"Research.xml")
		.then(function(data) {
		db.research=data.ArrayOfResearchDataEntry.ResearchDataEntry;

		return readFile(path+"TerrainData.xml");
	}).then(function(data) {
		db.terrain=data.ArrayOfTerrainDataEntry.TerrainDataEntry;
		
		return readFile(path+"Items.xml");
	}).then(function(data) {
		db.items=data.ArrayOfItemEntry.ItemEntry;
		
		return readFile(path+"RecipeSets.xml");
	}).then(function(data) {
		var recipeSets=toArray(data.ArrayOfRecipeSet && data.ArrayOfRecipeSet.RecipeSet);
		
		return Promise.all(recipeSets.map(function(recipeSet) {
			return readRecipeSetFile(recipeSet,path);
		}).concat(findXmlFiles(path+"GenericAutoCrafter").map(function(file) {
			return readGacFile(file);
		})));
		
	}).then(function(recipes) {
		db.recipes=recipes.reduce(function(acc,a) {
			return acc.concat(a);
		},[]);
		return db;
	});
};