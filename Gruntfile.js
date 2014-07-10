module.exports = function (grunt) {
	// load modules
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	// config
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		cssmin: {
			options: {
				keepSpecialComments: 0
			},
			minify: {
				expand: true,
				cwd: 'static/css/dev/',
				src: ['*.css', '!*.min.css'],
				dest: 'static/css/min/',
				ext: '.min.css'
			}
		},
		concat: {
			options: {
				stripBanners: true
			},
			dist: {
				src: 'static/css/min/*.min.css',
				dest: 'static/css/ink.min.css'
			},
		}
	});

	// register tasks
	grunt.registerTask('default', ['cssmin', 'concat']);
}
