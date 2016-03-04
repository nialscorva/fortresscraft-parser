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

angular.module('fortressCraftBrowserApp', []);