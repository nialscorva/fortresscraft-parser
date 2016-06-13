var toArray=require("./toArray.js");

var Database=function() {
	this.allTerrain=[];
	this.terrainByKeyIndex={};

	this.allResearch=[];
	this.researchByKeyIndex={};       // by Key
	this.researchByTierIndex=[]; // by the highest scan or research pod required
	
	this.allRecipes=[];
	this.recipesByKeyIndex={};  // by Key
	this.recipesByNameIndex={}; // by CraftedName
	
	this.itemsByName={};	
};

//=========================================================
// Items

Database.prototype.itemByName=function(name) {
	return this.itemsByName[name]=this.itemsByName[name] || {
		displayName: name,
		url: "item/"+encodeURIComponent(name),
		_links: {},
		recipes: [],
		
		
	}
};

//=========================================================
// Research
Database.prototype.forEachResearch= function(fn) {
	var db=this;
	this.allResearch.forEach(function(r) {
		fn(r,db);
	});
};

Database.prototype.researchByTier= function(index) {
	return toArray(this.researchByTierIndex[index]);
};

Database.prototype.researchByKey= function(researchKey) {
	return this.researchByKeyIndex[researchKey.toLowerCase()];
};

Database.prototype.insertResearch= function(r) {
	r._links={};
	r.displayName=r.Name;
	r.url="research/"+encodeURIComponent(r.Key);
	r.ResearchRequirements=toArray(r.ResearchRequirements && r.ResearchRequirements.Research);
	r.ScanRequirements=toArray(r.ScanRequirements && r.ScanRequirements.Scan);

	this.researchByTierIndex[r.oreTier]=this.researchByTierIndex[r.oreTier] || [];
	this.researchByTierIndex[r.oreTier].push(r.Key.toLowerCase());
	this.researchByKeyIndex[r.Key.toLowerCase()]=r;
	this.allResearch.push(r);
};

//=========================================================
// Recipe
Database.prototype.insertRecipe= function(i){
	var item=this.itemByName(i.CraftedName);
	if(!i.CraftedName) {
		console.error("Recipe doesn't have a CraftedName: ",i);
		return;
	}
	//if(i.Key==="minecartstation") {
	//	i.Key=i.CraftedName.toLowerCase();
	//}
	// Normalize the record
	i._links={};
	i.displayName=i.CraftedName;
	i.url="recipe/"+encodeURIComponent(i.Key);
	i.ResearchRequirements=toArray(i.ResearchRequirements && i.ResearchRequirements.Research);
	i.ScanRequirements=toArray(i.ScanRequirements && i.ScanRequirements.Scan);

//	i.ScanRequirements=toArray(i.ScanRequirements);
	i.Costs=toArray(i.Costs);
	i.Costs.forEach(function(c) {
		c.CraftCost=toArray(c.CraftCost);
		c.CraftedAmount=i.CraftedAmount;
		c.CanCraftAnywhere=i.CanCraftAnywhere;
		c.craftStation=i.craftStation;
		c.sourceFile=i.sourceFile;
		c.Hint=i.Hint;
	});
	delete i.CraftedAmount;
	delete i.CanCraftAnywhere
	delete i.craftStation;
	delete i.sourceFile;
	delete i.Hint;
	
	// in 4.x, PSB Organic had multiple ResearchRequirements, creating an array of objects each with "Requirements".
	// Flatten these multiple requirements to make the data cleaner
	// if(Array.isArray(i.ResearchRequirements)) {
		// i.ResearchRequirements={
			// Research: toArray(i.ResearchRequirements).reduce(function(acc,reqs) { return acc.concat(reqs.Research);},[])
		// };
	// }
	
	// now look for existing records
	var record=this.recipeByKey(i.Key);
	if(record) {
		for(var k in i) {
			if(Array.isArray(record[k])) {
				i[k].forEach(function(v) {
					if(record[k].indexOf(v) <0) {
						record[k].push(v);
					}
				});
				//Array.prototype.push.apply(record[k],toArray(i[k]));
			}	else if(k==="_links") {
				for(var rel in i._links) {
					record._links[rel]=record._links[rel] || [];
					Array.prototype.push(record._links[rel],i._links[rel]);
				}
			}else if(record[k] !== i[k]) {
				console.log("Different values: '" + i.Key + "'::'" + k+"'");
				console.log("   existing -> ",record[k]);
				console.log("   new -> ",i[k]);
			}
		}
		i=record;
	} else {
		this.allRecipes.push(i);
		this.recipesByNameIndex[i.CraftedName.toLowerCase()]=i;
		this.recipesByKeyIndex[i.Key]=i;
	}
	return i;
};
Database.prototype.forEachRecipe= function(fn) {
	var db=this;
	this.allRecipes.forEach(function(r) {
		fn(r,db);
	});
};


Database.prototype.recipeByName= function(name) {
	return this.recipesByNameIndex[name.toLowerCase()];
};

Database.prototype.recipeByKey= function(key) {
	return this.recipesByKeyIndex[key];
};

Database.prototype.findOrCreateRecipeByName= function(name) {
	var r=this.recipesByNameIndex[name.toLowerCase()];
	if(!r) {
		r=this.insertRecipe({
			CraftedName: name,
			Key: name.toLowerCase()
		});
	}
	return r;
};
//=========================================================
// Terrain

Database.prototype.toTerrainId=function(t,v) {
	if(!t) { return null;}
	return t.toLowerCase() + ((0<=v)?(":" + v.toLowerCase()):"");
};

Database.prototype.terrainByKey= function(type,value) {
	return this.terrainByKeyIndex[this.toTerrainId(type,value)];
};

Database.prototype.insertTerrain= function(terrainType){
	terrainType.CompositeKey=this.toTerrainId(terrainType.CubeType,terrainType.Value);
	terrainType._links={};
	terrainType.displayName=terrainType.Name;
	terrainType.url="terrain/"+encodeURIComponent(terrainType.CompositeKey);
	this.terrainByKeyIndex[terrainType.CompositeKey]=terrainType;
	this.allTerrain.push(terrainType);
	
	var self=this;
	// Now loop through the Values and create subtypes
	toArray(terrainType.Values && terrainType.Values.ValueEntry).forEach(function(valueEntry) {
		// clone the base type
		var clone=JSON.parse(JSON.stringify(terrainType));
		// subtype doesn't have subtypes
		delete clone.Values;
		
		// override the base type's values with the subtype values
		for(var f in valueEntry) {
			clone[f]=valueEntry[f];
		}
		// create a new id
		self.insertTerrain(clone);
		
	});
};

Database.prototype.scanRequirementName= function(scanReq) {
	var t=this.terrainByKeyIndex[this.toTerrainId(scanReq.type,scanReq.value)];
	return t.Name;
};


module.exports=Database;