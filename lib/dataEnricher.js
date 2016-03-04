var fs=require('fs');
var csvParse=require('csv-parse');

var filterTypes={
	"Crafted": function(i) { 
		return ["ItemSingle","ItemDurability","ItemCharge","ItemStack"].indexOf(i.item.Type) >0;
	},
	"Combustable" : function(i) { 
		return [16,103,105,104,14,80,87,170,165].indexOf(i.item.ItemID) >0;
	},
	"Garbage": function(i) { 
		return [4,2,21,3,199,200,24,12,169,168,7].indexOf(i.item.ItemID) >0;
	},
	"Ore": function(i) { 
		return [88,84,86,85,89,150,153,152,151,90,91,92,93,94].indexOf(i.item.ItemID) >0;
	},
	"Smeltable": function(i) { 
		return [88,84,86,85,89,150,151,90,91,92,93,94].indexOf(i.item.ItemID) >0;
	},
	"Organic": function(i) { 
		return i.item.ItemID >=4000 && i.item.ItemID <=4101;
	},
	"Crystal": function(i) { 
		return [152].indexOf(i.item.ItemID) >0;
	},
	"Gems": function(i) { 
		return [162].indexOf(i.item.ItemID) >0;
	},
	"Bars": function(i) { 
	// low grade steel (itemId 86) is not a "bar"
		return [5,15,25,45,65,75,85].indexOf(i.item.ItemID) >0;
	},
	"Biomass": function(i) { 
		[153].indexOf(i.item.ItemID) >0;
	},
};

var addFilterType=function(r) {
	r.filterTypes=[];
	for(var filterType in filterTypes) {
		if(r.item) {
			r.item.ItemID=parseInt(r.item.ItemID);
			if(filterTypes[filterType](r)) {
				r.filterTypes.push(filterType);
			}
		}
	}
};

var deepMerge=function(r,overlay) {
	if(!r || !overlay) return;
	for(var k in overlay) {
		if(!(k in r)) {
			r[k]=overlay[k];
		} else if(Array.isArray(r[k])) {
			r[k]=toArray(r[k],overlay[k]);
		} else if(typeof(r[k]) === "object" && typeof(overlay[k])==="object") {
			deepMerge(r[k],overlay[k]);
		} else {
			console.error("Cowardly refusing to overwrite key ",k," in ", r, " from ", overlay);
		}
	}
};
var deepSet=function(obj,path,value) {
	if(value===undefined) {
		return;
	}
	var o=obj;
	var p=path.split(".");
//	console.log("DeepSet ",path," on ",obj);
	while(p.length > 1) {
//		console.log("---- path=",path)
		var field=p.shift();
//		console.log("---- field=",field, " on ", o);
		if(o[field]===undefined) {
			o[field]={};
		}
		if(typeof(o[field]) !== "object") {
			console.error("Field '", field,"' is already set and not an Object in ", path, " on ",obj,"\n\n");
			return;
		}
		o=o[field];
	}
//	console.log("DeepSet done!\n\n");
	if(typeof(o) !== "object") {
		console.error("Field '", field,"' is already set and not an Object in ", path, " on ",obj,"\n\n");
		return;
	}
	o[p[0]]=value;

};
var fixCsvValue=function(v) {
	if(v==="TRUE") {
		return true;
	} else if (v==="FALSE") {
		return false;
	} else if (v==="") {
		return undefined;
	} else {
		return v;
	}
}

var loadCsvCodex=function(csvFileName) {
	csvFileName=csvFileName||"codex.csv";
	return new Promise(function(resolve,reject) {
		var codex={'$$CodexName$$': csvFileName};
		console.log("Processing ",csvFileName," as CSV");
		var csvFile=fs.readFileSync(csvFileName,"ascii")
		csvParse(csvFile,{trim:true,auto_parse:true},function(err,output) {
			if(err) {
				reject(err);
			}
			var categories=output.shift();
			var fieldNames=output.shift();
			var currentCategory="";
			// skip the first column-- name
			fieldNames.shift();
			categories.shift();
			var columns=fieldNames.map(function(f,i) {
				if(categories[i]) {
					currentCategory=categories[i]+".";
				}
				return currentCategory+fieldNames[i];
			});
			
	//		console.error("CSV Columns: ",columns);
			var processRow=function(row) {
				var name=row.shift();
				codex[name]=codex[name] || {};
				row.forEach(function(v,i) {
					deepSet(codex[name],columns[i],fixCsvValue(v));
				});
			};
			output.forEach(processRow);
	//		console.log(JSON.stringify(codex,null,2));
			resolve(codex);
		});
	});
}
var loadJsonCodex=function(jsonFileName) {
	jsonFileName=jsonFileName || "codex.json";
	return new Promise(function(resolve,reject) {
		var codex={'$$CodexName$$': jsonFileName};
		try {
			var file=fs.readFileSync(jsonFileName,"ascii")
			codex=JSON.parse(file);
			codex['$$CodexName$$']=jsonFileName;
		}	catch(e) {
			console.error("Failed to parse codex.json -- ",e.message,e.stack);
		}
		resolve(codex);
	});
};

module.exports=function(db) {
	return Promise.all([
		loadCsvCodex("codex.csv"),
		loadJsonCodex("codex.json")
	]).then(function(codices) {
		db.forEachRecipe(function(r) {
			addFilterType(r);
			codices.forEach(function(codex) {
				if(codex[r.displayName]) {
					console.log("Merging codex data for ",r.displayName, " from ",codex['$$CodexName$$']);
					deepMerge(r,codex[r.displayName]);
				}
			});
		});
		return db;
	});	
	
//		multiblockMachine=[587,590,592,593,597,598,600,588,589,591,594,595,596,599,544,546,547,548,549,545]
};
