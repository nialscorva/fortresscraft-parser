var fs = require('fs');
var xml2js = require('xml2js');

function readFile(filename) {
	return new Promise(function(resolve,reject) {
		var xml = fs.readFileSync(filename, "utf8");
		xml2js.parseString(xml,{explicitArray:false,trim:true}, function (err, result) {
			if(err) {
				reject(err);
			} else {
				resolve(result);	
			}
		});
	});
}

module.exports=function(path) {
	path=path || "./xmlfiles/";
	return Promise.all([
		readFile(path+"research.xml"), // 0
		readFile(path+"TerrainData.xml"), // 1
		readFile(path+"ManufacturerRecipes.xml"), // 2
		readFile(path+"RefineryRecipes.xml"), // 3
		readFile(path+"SmelterRecipes.xml"), // 4
		readFile(path+"CoilerRecipes.xml"), // 5
		readFile(path+"ExtruderRecipes.xml"), // 6
		readFile(path+"PCBAssemblerRecipes.xml"), // 7
		readFile(path+"PipeExtruderRecipes.xml"), // 8
		readFile(path+"ResearchAssemblerRecipes.xml"), // 9
		readFile(path+"StamperRecipes.xml"), // 10
	]).then(function(results) {		
		var allRecipes=results[2].ArrayOfCraftData.CraftData.concat(
										results[3].ArrayOfCraftData.CraftData,
										results[4].ArrayOfCraftData.CraftData,
										results[5].ArrayOfCraftData.CraftData,
										results[6].ArrayOfCraftData.CraftData,
										results[7].ArrayOfCraftData.CraftData,
										results[8].ArrayOfCraftData.CraftData,
										results[9].ArrayOfCraftData.CraftData,
										results[10].ArrayOfCraftData.CraftData
		)
		return [
			results[0].ArrayOfResearchDataEntry.ResearchDataEntry,
			results[1].ArrayOfTerrainDataEntry.TerrainDataEntry,
			allRecipes
		];
	});
};