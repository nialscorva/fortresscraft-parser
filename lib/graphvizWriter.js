'use strict';
var progression = require("./progressionTiers.js");
var toArray=require("./toArray.js");


// set to false to only draw the research items
var drawItemNodes=true;

//===============================================================
// Graph Utility Functions
var toLabel=function(i) { 
	return '"'+i.toLowerCase()+'"';
};

// converts an integer tier value into the string if possible, but handles invalid tiers
var toTierLabel=function(i) { 
	if(typeof(i)==="number") {
		i=progression.labels[i];
	}
	return toLabel("TIER_"+i);
};


// Draw the entire graphviz document
module.exports=function(db) {	
	var retval="";
	var out=function(s) { retval += s+"\n";}

	// Takes an array, puts label on it as the header, and loops over the array applying rowFn to get the content for each
	var createRows=function(list,label,rowFn) {
		list=toArray(list);
		if(list.length) {
			out("  <TR><TD>"+label+"</TD><TD>");
			out(list.map(rowFn).join("<BR/>\n"));
			out("  </TD></TR>");
		}
		return retval;
	};

	// Creates the graphviz research node
	var outputResearchNode=function(r,db) {
		out(toLabel(r.Key)+' [color=black, margin=0, shape=none, label=<');
		out('<TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0"  HEIGHT="32">');
		out('  <TR><TD COLSPAN="2"><FONT POINT-SIZE="32">'+r.Name+'</FONT></TD></TR>');
		
		createRows(r.ScanRequirements && r.ScanRequirements.Scan,"Scan Reqs",function(scan) {
			return db.scanRequirementName(scan);
		});

		createRows(r.ProjectItemRequirements && r.ProjectItemRequirements.Requirement,"Pods",function(p) {
			return p.Name+":"+p.Amount;
		});
		
		if(!drawItemNodes) {
			createRows(r.unlockedRecipes,"Unlocks Recipes",function(recipeId) {
				var recipe=db.recipeByKey(recipeId);
				if(! recipe) { 
					return "Unknown Recipe: "+recipeId; 
				}
				return recipe.CraftedName;
			});
		}
		out('</TABLE>>]');
		
		// edges from other research
		toArray(r.ResearchRequirements && r.ResearchRequirements.Research).forEach(function(req) {
			out(toLabel(req)+" -> "+toLabel(r.Key) + " [penwidth=3]");
		});

		out("//-------- end of "+ toLabel(r.Key) + " ----------");
	};

	// creates a node for a recipe on the graph
	var outputRecipeNode=function(r,db) {

		if(r.oreTier===undefined || !r.ResearchRequirements || !r.ResearchRequirements.Research) return;
		var recipeId=r.CraftedName.toLowerCase();
		out("  "+toLabel(recipeId)+' [color=green, margin=0, shape=none, label=<');
		out('<TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" HEIGHT="60">');
		var suffix=(r.CraftedAmount>1?("(x"+r.CraftedAmount+")"):"");
		out('  <TR><TD COLSPAN="2"><FONT POINT-SIZE="24">'+r.CraftedName+suffix+'</FONT></TD></TR>');
		createRows(r.ScanRequirements && r.ScanRequirements.Scan,"Scan Reqs",function(scan) {
			return db.scanRequirementName(scan);
		});
		createRows(r.Costs && r.Costs.CraftCost,"Ingredients",function(p) {
			return p.Name+":"+p.Amount;
		});
		out('</TABLE>>]');
		toArray(r.ResearchRequirements.Research).forEach(function(researchId) {
			var attr="";
			if(db.researchByKey(researchId).oreTier === r.oreTier) {
			}
			out("  "+toLabel(researchId)+"->"+toLabel(recipeId)+ '[color=blue]');
		});
	};

	
	
	//===============================================================
	// Graph Header
	out("digraph G {");
	out("  rankdir=LR");
//	out("  concentrate=true");
	out("  splines=ortho");
	out("  ordering=out");
	out('  ranksep="1.2 equally"');
		
	out('{  '+progression.labels.map(toTierLabel).join('->')+'}\n');
	
	db.forEachResearch(outputResearchNode);
	
	if(drawItemNodes) {
		db.forEachRecipe(outputRecipeNode);
	}
	//===============================================================
	// Set up the Tiers
	var recipesSeen={};
	var hasLabelBeenSeen=function(id,label) {
		if(recipesSeen[id] && recipesSeen[id] !== label) {
			console.error("Tier conflict: ",id," previously seen in ",recipesSeen[id]," and again in ",label);
			return true;
		}
		recipesSeen[id]=label;
		return false;
	}
	
	progression.labels.forEach(function(label,index) {
		out("  { ");
		out('    rank=same;');
		out('  '+toTierLabel(index)+' [shape=box3d,label=<<FONT POINT-SIZE="24">Progression: '+label+'</FONT>>]'); 

		db.researchByTier(index).forEach(function(i) {
			if(!hasLabelBeenSeen(i,label)) {
				out('    '+toLabel(i)+';');
			}
		});
		
		if(drawItemNodes) {
			// there are a couple duplicate item keys that mess up the ore progression due to being in different tiers
			// this is true if using CraftedName (e.g. location marker) or Key (e.g. miningcartstation, couple others)
			// crafted name has fewer conflicts and works better with the ingredient lookup, so use it.
//			Object.keys(recipes).forEach(function(id) {
//				var r=recipes[id];
			db.forEachRecipe(function(r) {
				if(r.oreTier !== index || !r.ResearchRequirements || !r.ResearchRequirements.Research) return;
				if(hasLabelBeenSeen(r.CraftedName,label)) return;
		
				out('    '+toLabel(r.CraftedName)+';');
			});
		}
		out("  }\n");
	});



	//===============================================================
	// End of graph
	out("}");
	return retval;
};