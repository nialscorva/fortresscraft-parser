var progression = require("./progressionTiers.js");
var toArray=require("./toArray.js");


module.exports=function(results) {
	var research={};
	var researchByTier=[]; // by the highest scan or research pod required
	
	var recipes={};  // by key
	var recipesByName={}; // by CraftedName
	var recipesByTier=[];
	
	var allRecipes=results[2];
	
	var terrain={};
	
	// Terrain is easiest, set it up first
	results[1].forEach(function(i) {
		terrain[i.CubeType.toLowerCase()]=i;
	});
	
	var scanRequirementName=function(scanReq) {
		var t=terrain[scanReq.type];
		var name=t.Name;
		if(scanReq.value!=="-1") {
			t.Values.ValueEntry.forEach(function(v) {
				if(v.Value===scanReq.value) {
					name=v.Name;
				}
			});
		}
		return name;
	};
	
	// Pull in all of the research topics
	results[0].forEach(function(i) {
		var dependencies=toArray(
			i.ProjectItemRequirements && i.ProjectItemRequirements.Requirement,
			toArray(i.ScanRequirements && i.ScanRequirements.Scan).map(function(s) {
					return terrain[s.type];
			})
		);
		// if the research requires any items, it requires a lab be built, first
		var minimumTier=(i.ProjectItemRequirements && i.ProjectItemRequirements.Requirement)?progression.labTier:0;
		i.unlockedRecipes=[];
		i.oreTier=dependencies.reduce(function(acc,req) {
			//console.error(i.Key," uses pod ",req.Name," of tier ",progression.rootTiers[req.Name]);
			if(req.Name in progression.rootTiers) {
				return Math.max(acc,progression.rootTiers[req.Name]);
			} else {
				console.error(i.Key," has unknown dependency: ",req);
			}
		},minimumTier);
		research[i.Key.toLowerCase()]=i;
		researchByTier[i.oreTier]=researchByTier[i.oreTier] || [];
		researchByTier[i.oreTier].push(i.Key.toLowerCase());
	});
	
	// Go through recipes, now
	allRecipes.forEach(function(i) {
		recipes[i.CraftedName.toLowerCase()]=i;
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
			} else if(recipes[ingredient.Name.toLowerCase()] !== undefined) {
				recipe.oreTier=Math.max(recipe.oreTier,calculateCraftTier(recipes[ingredient.Name.toLowerCase()]));
			} else {
				unknownBaseTiers[ingredient.Name]=true;
			}
		});

		toArray(recipe.ScanRequirements && recipe.ScanRequirements.Scan).forEach(function(ingredient) {
			var name=scanRequirementName(ingredient);
			if(progression.rootTiers[name] !== undefined) {
				recipe.oreTier=Math.max(recipe.oreTier, progression.rootTiers[name]);
			} else {
				unknownBaseTiers[name]=true;
			}
		});
		
		toArray(recipe.ResearchRequirements && recipe.ResearchRequirements.Research).forEach(function(req) {
			var r=research[req.toLowerCase()];
			recipe.oreTier=Math.max(recipe.oreTier, r.oreTier);
			r.unlockedRecipes.push(recipe.CraftedName);
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
		recipeByKey: function(key) {
			return recipes[key.toLowerCase()];
		},
		scanRequirementName: scanRequirementName
	};
	return db;
};
