module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-inline');
	grunt.loadNpmTasks('grunt-exec');	
	
	grunt.initConfig({
		commands: {
			graphviz: '"c:/Program Files (x86)/Graphviz2.38/bin/dot"',
			node: "node"
		},
		
		exec: {
			buildData: {
				cmd: '<%=commands.node%> main.js'
			},
			buildGraph: {
				cmd: '<%=commands.graphviz%> -odist/graph.png -Tpng graph.dot'
			}
		},
		
	  inline: {
	    dist: {
				options: {
					cssmin:true,
					tag: '',
					uglify: true
				},					
	      src: 'html/index.html',
	      dest: 'dist/index.html'
	    }
	  }
	});
	
	grunt.registerTask('default',['exec:buildData','inline:dist']);
};