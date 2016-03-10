var progression = require("./progressionTiers.js");
var toArray=require("./toArray.js");

module.exports=function(db) {
	var linkResearch=function(r) {
		r.ResearchRequirements.forEach(function(req) {
			var reqResearch=db.researchByKey(req);
			if(!reqResearch) {
				console.error("Unknown research ",req);
				return;
			}
			
			r._links.researchRequirement=r._links.researchRequirement || [];
			r._links.researchRequirement.push({
				href: reqResearch.url,
				title: reqResearch.displayName
			});
			
			reqResearch._links.researchRequirementFor=reqResearch._links.researchRequirementFor || [];
			reqResearch._links.researchRequirementFor.push({
				href: r.url,
				title: r.displayName
			});
		});
	};
	var linkScanRequirements=function(r) {
		toArray(r.ScanRequirements).forEach(function(req) {
			var reqTerrain=db.terrainByKey(req.type,req.value);
			if(!reqTerrain) {
				console.error("Unknown terrain: ",req);
				return;
			}
			req.href=reqTerrain.url;
			req.title=reqTerrain.displayName;
			reqTerrain._links.scanRequirementFor=reqTerrain._links.scanRequirementFor || [];
			reqTerrain._links.scanRequirementFor.push({
				href: r.url,
				title: r.displayName
			});
		});
	};
	
	// Go back through and link them properly
	db.forEachRecipe(function(r) {
		linkResearch(r);
		linkScanRequirements(r);
		r.Costs.forEach(function(recipe) {
			if(!Array.isArray(recipe.CraftCost)) {
				console.error("Junk recipe? -- ",recipe,"\n   on ",r);
				return;
			}
			recipe.CraftCost.forEach(function(req) {
				var reqRecipe=db.findOrCreateRecipeByName(req.Name);
				if(!reqRecipe) {
					console.error("Unknown recipe: ",req.Name);
					return;
				}
				req.href=reqRecipe.url;
				req.title=reqRecipe.displayName;
				reqRecipe._links.ingredientFor=reqRecipe._links.ingredientFor || [];
				reqRecipe._links.ingredientFor.push({
					href: r.url,
					title: r.CraftedName,
					amount: req.Amount
				});
			});
		});
	});
	db.forEachResearch(function(r) {
		linkResearch(r);
		linkScanRequirements(r);
		toArray(r.ProjectItemRequirements && r.ProjectItemRequirements.Requirement).forEach(function(req) {
			var reqRecipe=db.recipeByName(req.Name);
			req.href=reqRecipe.url;
			req.title=reqRecipe.displayName;
			reqRecipe._links.ingredientFor=reqRecipe._links.ingredientFor || [];
			reqRecipe._links.ingredientFor.push({
				href: r.url,
				title: r.CraftedName,
				amount: req.Amount
			});
		});
		
	});

	return db;
};
