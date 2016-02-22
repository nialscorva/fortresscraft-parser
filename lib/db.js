var progression = require("./progressionTiers.js");
var toArray=require("./toArray.js");

var mergeChildren=function(e,field) {
	if(Array.isArray(e)) {
		return toArray(e.map(function(i) { return i[field];}));
	}
};


module.exports=function(results) {
	var allTerrain=results[1];
	var terrain={};

	var allResearch=results[0];
	var research={};       // by Key
	var researchByTier=[]; // by the highest scan or research pod required
	
	var allRecipes=results[2];
	var recipes={};  // by Key
	var recipesByName={}; // by CraftedName
	var recipesByTier=[];
	
	var toTerrainId=function(t,v) {
		return t.toLowerCase() + ((0< v)?(":" + v.toLowerCase()):"");
	};
	var db={
		forEachResearch: function(fn) {
			Object.keys(research).forEach(function(r) {
				fn(research[r],db);
			});
		},
		forEachRecipe: function(fn) {
			allRecipes.forEach(function(r) {
				fn(r,db);
			});
		},
		researchByTier: function(index) {
			return toArray(researchByTier[index]);
		},
		researchByKey: function(researchKey) {
			return research[researchKey.toLowerCase()];
		},
		recipeByName: function(key) {
			return recipesByName[key.toLowerCase()];
		},
		terrainByKey: function(type,value) {
			return terrain[toTerrainId(type,value)];
		},
		insertRecipe: function(i){
			i._links={};
			i.displayName=i.Name;
			i.url="recipe/"+i.Key;
			recipesByName[i.CraftedName.toLowerCase()]=i;
			recipes[i.Key]=i;
		},
		insertTerrain: function(terrainType){
			terrainType.CompositeKey=toTerrainId(terrainType.CubeType,terrainType.Value);
			terrainType._links={};
			terrainType.displayName=terrainType.Name;
			terrainType.url="terrain/"+terrainType.CompositeKey;
			terrain[terrainType.CompositeKey]=terrainType;
		},
		insertResearch: function(r) {
			r._links={};
			r.displayName=r.Name;
			r.url="research/"+r.Key;
			researchByTier[r.oreTier]=researchByTier[r.oreTier] || [];
			researchByTier[r.oreTier].push(r.Key.toLowerCase());
			research[r.Key.toLowerCase()]=r;
		},
		scanRequirementName: function(scanReq) {
			var t=terrain[toTerrainId(scanReq.type,scanReq.value)];
			return t.Name;
		},
		research: 	allResearch,
		recipes: allRecipes,
		terrain: allTerrain
	};
	
	// Terrain is easiest, set it up first
	allTerrain.forEach(function(terrainType) {
		db.insertTerrain(terrainType);
		// loop over the subtypes and create entries for them
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
			db.insertTerrain(clone);
			allTerrain.push(clone);
		});
	});
	
	// Pull in all of the research topics
	allResearch.forEach(function(i) {
		var dependencies=toArray(
			i.ProjectItemRequirements && i.ProjectItemRequirements.Requirement,
			toArray(i.ScanRequirements && i.ScanRequirements.Scan).map(function(s) {
					return terrain[s.type];
			})
		);
		// if the research requires any items, it requires a lab be built, first
		var minimumTier=(i.ProjectItemRequirements && i.ProjectItemRequirements.Requirement)?progression.labTier:0;

		i.oreTier=dependencies.reduce(function(acc,req) {
			//console.error(i.Key," uses pod ",req.Name," of tier ",progression.rootTiers[req.Name]);
			if(req.Name in progression.rootTiers) {
				return Math.max(acc,progression.rootTiers[req.Name]);
			} else {
				console.error(i.Key," has unknown dependency: ",req);
			}
		},minimumTier);
		db.insertResearch(i);
		
	});
	
	// Go through recipes, now
	allRecipes.forEach(function(i) {
		db.insertRecipe(i);
	});

	for(var k in progression.rootTiers) {
		if(!db.recipeByName(k)) {
			console.error("Creating entry for ",k);
			var mock={
				"Key": k.toLowerCase(),
				"CraftedName": k,
				"Description": k,
				"oreTier" : progression.rootTiers[k]
			};
			db.insertRecipe(mock);
			allRecipes.push(mock);
		}
	}
	
	var linkResearch=function(r) {
		toArray(r.ResearchRequirements && r.ResearchRequirements.Research).forEach(function(req) {
			var reqResearch=db.researchByKey(req);
			if(!reqResearch) {
				console.error("Unknown research ",req);
				return;
			}
			//req.Key=reqResearch.Key;
			reqResearch._links.researchRequirementFor=reqResearch._links.researchRequirementFor || [];
			reqResearch._links.researchRequirementFor.push({
				href: "recipe/"+r.Key,
				title: r.CraftedName || r.Name
			});
		});
	};
	var linkScanRequirements=function(r) {
		toArray(r.ScanRequirements && r.ScanRequirements.Scan).forEach(function(req) {
			var reqTerrain=db.terrainByKey(req.type,req.value);
			if(!reqTerrain) {
				console.error("Unknown terrain: ",req);
				return;
			}
			req.Key=reqTerrain.CompositeKey;
			reqTerrain._links.scanRequirementFor=reqTerrain._links.scanRequirementFor || [];
			reqTerrain._links.scanRequirementFor.push({
				href: "recipe/"+r.Key,
				title: r.CraftedName || r.Name
			});
		});
	};
	
	// Go back through and link them properly
	allRecipes.forEach(function(r) {
		linkResearch(r);
		linkScanRequirements(r);
		toArray(r.Costs && r.Costs.CraftCost).forEach(function(req) {
			var reqRecipe=db.recipeByName(req.Name);
			if(!reqRecipe) {
				console.error("Unknown recipe: ",req.Name);
				return;
			}
			req.Key=reqRecipe.Key;
			reqRecipe._links.ingredientFor=reqRecipe._links.ingredientFor || [];
			reqRecipe._links.ingredientFor.push({
				href: "recipe/"+r.Key,
				title: r.CraftedName,
				amount: req.Amount
			});
		});
	});
	allResearch.forEach(function(r) {
		linkResearch(r);
		linkScanRequirements(r);
		toArray(r.ProjectItemRequirements && r.ProjectItemRequirements.Requirement).forEach(function(req) {
			var reqRecipe=db.recipeByName(req.Name);
			req.Key=reqRecipe.Key;
			reqRecipe._links.ingredientFor=reqRecipe._links.ingredientFor || [];
			reqRecipe._links.ingredientFor.push({
				href: "recipe/"+r.Key,
				title: r.CraftedName,
				amount: req.Amount
			});
		});
		
	});
	
	// go back through the recipes and calculate their tier
	var unknownBaseTiers={};
	
	var calculateCraftTier=function(recipe) {
		if(recipe.oreTier) {
			return recipe.oreTier;
		}
		
		recipe.oreTier=-1;
		toArray(recipe.Costs && recipe.Costs.CraftCost).forEach(function(ingredient) {
			if(progression.rootTiers[ingredient.Name] !== undefined) {
				recipe.oreTier=Math.max(recipe.oreTier, progression.rootTiers[ingredient.Name]);
			} else if(db.recipeByName(ingredient.Name) !== undefined) {
				recipe.oreTier=Math.max(recipe.oreTier,calculateCraftTier(db.recipeByName(ingredient.Name)));
			} else {
				unknownBaseTiers[ingredient.Name]=true;
			}
		});

		toArray(recipe.ScanRequirements && recipe.ScanRequirements.Scan).forEach(function(ingredient) {
			var name=db.scanRequirementName(ingredient);
			if(progression.rootTiers[name] !== undefined) {
				recipe.oreTier=Math.max(recipe.oreTier, progression.rootTiers[name]);
			} else {
				unknownBaseTiers[name]=true;
			}
		});
		
		toArray(recipe.ResearchRequirements && recipe.ResearchRequirements.Research).forEach(function(req) {
			var r=research[req.toLowerCase()];
			recipe.oreTier=Math.max(recipe.oreTier, r.oreTier);
		});
		
		recipesByTier[recipe.oreTier]=recipesByTier[recipe.oreTier] || [];
		recipesByTier[recipe.oreTier].push(recipe.Key);
		return recipe.oreTier;
	}

	allRecipes.forEach(calculateCraftTier);
	
	if(Object.keys(unknownBaseTiers).length) {
		console.error("Unknown ore tiers for items: ");
		Object.keys(unknownBaseTiers).forEach(function(i){
			console.error('  "'+i+'": 0,');
		});
	}
	

	return db;
};
