var progression = require("./progressionTiers.js");
var toArray=require("./toArray.js");

module.exports=function(db) {
	
	// Load the root tier stuff
	for(var k in progression.rootTiers) {
		var r=db.recipeByName(k);
		if(r) {
			r.oreTier=progression.rootTiers[k];
		} else {
			db.insertRecipe({
				"Key": k.toLowerCase(),
				"CraftedName": k,
				"Description": k,
				"oreTier" : progression.rootTiers[k]
			});
		}
	}
	
	// Pull in all of the research topics
	db.forEachResearch(function(i) {
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

	db.forEachRecipe(calculateCraftTier);
	
	if(Object.keys(unknownBaseTiers).length) {
		console.error("Unknown ore tiers for items: ");
		Object.keys(unknownBaseTiers).forEach(function(i){
			console.error('  "'+i+'": 0,');
		});
	}

	return db;
};
