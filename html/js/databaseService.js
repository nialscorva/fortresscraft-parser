'use strict';
var calculateFacets=function(results) {
	var facets={
		categories:{},
		tags:{},
		filterTypes:{}
	};

	for(var i=0; i< arguments.length;++i) {
		arguments[i].forEach(function(r) {
			if(r.Category) {
				facets.categories[r.Category]=1+facets.categories[r.Category] || 1;
			}
			toArray(r.tags && r.tags.tag).forEach(function(t) { facets.tags[t]=1+facets.tags[t] || 1;});
			toArray(r.filterTypes).forEach(function(t) { facets.filterTypes[t]=1+facets.filterTypes[t] || 1;});
		});
	}
	return facets;
}

// Declare app level module which depends on views, and components
angular.module('fortressCraftBrowserApp').service("database",["$rootScope","$q",function(rootScope,$q) {
	
	var nedbError=function(name) {
		var label="[nedb/"+name+"]";
		return function(err) {
			if(err) {
				console.error(label+"Failed on NeDB action: ",err);
			}
		};
	};

	var nedbInsertError=function(name) {
		var label="[nedb/"+name+"]";
		return function(err,newDocs) {
			if(err) {
				console.error(label+"Failed to insert database:",err);
			} else {
				//console.log(label+"Inserted " + newDocs + " into the database");
			}
		};
	};
	
	var db=new Nedb();
	db.ensureIndex({ fieldName: 'Key',unique: true, sparse: true},nedbError("recipe"));
	db.ensureIndex({ fieldName: 'displayName'},nedbError("recipe"));
	// db.ensureIndex({ fieldName: 'ScanRequirements.Scan.type'},nedbError("recipe"));
	// db.ensureIndex({ fieldName: 'Costs.CraftCost.Name'},nedbError("recipe"));
	// db.ensureIndex({ fieldName: 'ResearchRequirements.Research'},nedbError("recipe"));
	// db.ensureIndex({ fieldName: 'ResearchRequirements.Research'},nedbError("research"));
	// db.ensureIndex({ fieldName: 'unlockedRecipes'},nedbError("research"));
	// db.ensureIndex({ fieldName: 'CubeType'},nedbError("terrain"));
	// db.ensureIndex({ fieldName: 'tags.tag'},nedbError("terrain"));
	
	fceDatabase.recipes.forEach(function(r) {
		r._id=r.url;
		r.recordType="recipe";
		db.insert(r,function(err,newDoc){
			// if(err && err.errorType==="uniqueViolated") {
				// db.update({Key: r.Key,recordType: "recipe"},{$push: {Costs: r.Costs[0]}},nedbInsertError("recipeUpdate"));
			// }
			if(err) {
				console.error("Error inserting '",r.displayName,",: ",err," on key ",err.key,"\nRecipe=",r);
			}
		});
	});
	fceDatabase.research.forEach(function(r) {
		r._id=r.url;
		r.recordType="research";
	});
	fceDatabase.terrain.forEach(function(r) {
		r._id=r.url;
		r.recordType="terrain";
	});
	
	db.fceFacets=calculateFacets(fceDatabase.recipes,fceDatabase.research,fceDatabase.terrain);
	
	//	db.insert(fceDatabase.recipes,nedbInsertError("recipe"));
	db.insert(fceDatabase.research,nedbInsertError("recipe"));
	db.insert(fceDatabase.terrain,nedbInsertError("recipe"));
	return db;
}]);