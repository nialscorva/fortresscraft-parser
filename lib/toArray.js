module.exports=function() {
	var array=[];
	for(var i=0;i<arguments.length;++i) {
		if(arguments[i]!==undefined) {
			array=array.concat(arguments[i]);
		}
	}
	return array;
};