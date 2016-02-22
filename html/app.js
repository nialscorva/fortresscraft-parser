'use strict';
var toArray=function() {
	var array=[];
	for(var i=0;i<arguments.length;++i) {
		if(arguments[i]!==undefined) {
			array=array.concat(arguments[i]);
		}
	}
	return array;
};

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

// Declare app level module which depends on views, and components
angular.module('fortressCraftBrowserApp', [
])
.service("database",function() {

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
	
//	db.insert(fceDatabase.recipes,nedbInsertError("recipe"));
	db.insert(fceDatabase.research,nedbInsertError("recipe"));
	db.insert(fceDatabase.terrain,nedbInsertError("recipe"));
	return db;
})
.controller("appController",["$scope","database","$location",function($scope,db,loc) {
	$scope.selectedItem=null;
	$scope.setSelected=function(i) {
		if(typeof(i)=== "string") {
			console.log("Finding item ",i);
			db.findOne({_id: i}).exec(function(err,recipe) {
			$scope.$apply(function() {
				if(err) {
					console.error("Failed to set selected item:",err);
				} else {
					console.log("Found ",recipe);
					$scope.selectedItem=recipe;
				}
			});
		});
		} else {
			$scope.selectedItem=i;
		}
	};
	if(window.location.hash) {
		// window.setTimeout(function() {
			// $scope.$apply(function() {
				$scope.setSelected(window.location.hash.replace(/^#\//,""));
			// });
		// },1000);
	}

}])
.controller("searchController",["$scope","database",function($scope,database) {
	$scope.recipes=[];
	$scope.search={
		term: "Laser Energy",
		recipes: true,
		research: true,
		terrain: false,
		
	};
	$scope.resultsMessage="Type something to search";
	
	$scope.$watch('search',function() {
		$scope.recipes=[];
		$scope.resultsMessage="Searching...";

		var query={
			"displayName": { $regex: new RegExp($scope.search.term,"i") },
			"recordType" : { $nin:[]}
		};
		
		if(!$scope.search.recipes) { query.recordType.$nin.push("recipe");}
		if(!$scope.search.research) { query.recordType.$nin.push("research");}
		if(!$scope.search.terrain) { query.recordType.$nin.push("terrain");}
		
		database.find(query).sort({displayName:1}).exec(function(err,recipes) {
			$scope.$apply(function() {
				if(err) {
					$scope.resultsMessage=err;
				} else {
					$scope.recipes=$scope.recipes.concat(recipes);
					$scope.resultsMessage="Found " + recipes.length + " matches";
				}
			});
		});
	},true);
}])
.directive('typeBadge', function() {
  return {
    restrict: 'E',
		scope: {
			item: "="
		},
    template: '<span class="label {{type}}">{{item.recordType}}</span>',
		controller: ["$scope",function(scope) {
			scope.$watch("item.recordType",function() {
				switch(scope.item.recordType) {
					case "recipe": scope.type="label-primary" ; break;
					case "research": scope.type="label-success" ; break;
					case "terrain": scope.type="label-warning" ; break;
					default: scope.type="label-danger" ; break;
				}
			});
		}]
  };
})
.directive('tagBadge', function() {
  return {
    restrict: 'E',
		scope: {
			item: "="
		},
    template: '<span class="label label-default" ng-if="item.Category">{{item.Category}}</span>'+
							'<span class="label label-default" ng-repeat="t in item.tags.tag">{{t}}</span>'
  };
}).directive('optionalSectionGroup', function() {
  return {
    restrict: 'E',
		scope: {
			title: "@"
		},
		transclude: true,
    template: '<h2 class="optionSectionGroupHeader">{{title}}</h2><div class="optionSectionGroup" ng-transclude></div>'
  };
}).directive('optionalSection', function() {
  return {
    restrict: 'E',
		scope: {
			title: "@"
		},
		transclude: true,
    template: '<p class="optionSection"><strong>{{title}}</strong><span ng-transclude></span></p>'
  };
}).directive('itemLink', function() {
  return {
    restrict: 'E',
		scope: {
			item: "="
		},
    template: '<a href="#{{item.href}}" ng-click="$parent.setSelected(item.href)">{{item.title}}</a>'
  };
})
.filter("newline",function() { 
	return function(text) {
		return text.replace(/\\n/g,'\n');
	}
});
;