'use strict';

angular.module('fortressCraftBrowserApp')
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
})

.directive('optionalSectionGroup', function() {
  return {
    restrict: 'E',
		scope: {
			title: "@"
		},
		transclude: true,
    template: '<h2 class="optionSectionGroupHeader">{{title}}</h2><div class="optionSectionGroup" ng-transclude></div>'
  };
})

.directive('optionalSection', function() {
  return {
    restrict: 'E',
		scope: {
			title: "@"
		},
		transclude: true,
    template: '<p class="optionSection"><strong>{{title}}</strong><span ng-transclude></span></p>'
  };
})

.directive('itemLink', function() {
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
})
.filter('capitalize', function() {
  return function(input, scope) {
    if (input!=null)
    input = input.toLowerCase();
    return input.substring(0,1).toUpperCase()+input.substring(1);
  }
})
;