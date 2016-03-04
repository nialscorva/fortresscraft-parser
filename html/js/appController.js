'use strict';

angular.module('fortressCraftBrowserApp')
.controller("appController",["$scope","database","$location",function($scope,db,loc) {
	$scope.selectedItem=null;
	$scope.setSelected=function(i) {
		if(typeof(i)=== "string") {
			db.findOne({_id: i}).exec(function(err,recipe) {
			$scope.$apply(function() {
				if(err) {
					console.error("Failed to set selected item:",err);
				} else {
					// console.log("Found ",recipe);
					$scope.selectedItem=recipe;
				}
			});
		});
		} else {
			$scope.selectedItem=i;
		}
	};
	if(window.location.hash) {
		$scope.setSelected(window.location.hash.replace(/^#\//,""));
	}

}]);