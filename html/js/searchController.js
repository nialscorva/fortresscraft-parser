'use strict';
angular.module('fortressCraftBrowserApp')
.controller("searchController",["$scope","database",function($scope,database) {
	$scope.recipes=[];
	$scope.search={
		term: "Laser Energy",
		recordType: {
			recipe: true,
			research: true,
			terrain: false,
		},
		tags: [],
		categories: [],
		filterTypes: []
	};
	$scope.facets=database.fceFacets;	

	$scope.resultsMessage="Type something to search";
	
	$scope.$watch('search',function() {
		$scope.recipes=[];
		$scope.resultsMessage="Searching...";
		var query={
			"displayName": { $regex: new RegExp($scope.search.term,"i") }
		};
		
		query.recordType={ 
			"$in": Object.keys($scope.search.recordType || {}).filter(function(k) { return $scope.search.recordType[k];}) 
		};
		if($scope.search.categories.length) {
			// query.Category=$scope.search.categories;
			query.Category={ 
				"$in": $scope.search.categories.map(function(c) { return c;}) 
			};
		}
		if($scope.search.tags.length) {
			query["tags.tag"]={ 
				"$in": $scope.search.tags.map(function(c) { return c;}) 
			};
		}
		if($scope.search.filterTypes.length) {
			query["filterTypes"]={ 
				"$in": $scope.search.filterTypes.map(function(c) { return c;}) 
			};
		}		
		database.find(query).sort({displayName:1}).exec(function(err,recipes) {
			$scope.$apply(function() {
				if(err) {
					$scope.resultsMessage=err;
				} else {
					$scope.recipes=$scope.recipes.concat(recipes);
					$scope.facetCount=calculateFacets(recipes);
					//updateFacets($scope.facets);
					$scope.resultsMessage="Found " + recipes.length + " matches";
					console.log("Facets are now ",$scope.facets);
				}
				console.log("Search results for ",query,":",$scope.resultsMessage);
			});
		});
	},true);
}]);