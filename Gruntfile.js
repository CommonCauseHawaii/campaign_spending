module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: '_jekyll/j/*.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    haml: {
      haml_files: {
        expand: true,
        cwd: '_jekyll',
        src: ['**/*.haml'],
        dest: '_site/',
        ext: '.html',
        options: { language: 'ruby' }
      }
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-haml');

  // Default task(s).
  grunt.registerTask('default', ['haml']);

};
