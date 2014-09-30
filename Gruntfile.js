'use strict';

module.exports = function(grunt) {
  // Show elapsed time at the end
  require('time-grunt')(grunt);
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    nodeunit: {
      files: ['test/**/*_test.js']
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      }
    },
    mochacli: {
      options: {
        require: ['should'],

        slow: 1000,
        timeout: 0,
        bail: true
      },
      spec: {
        options: {
          reporter: 'spec'
        }
      },
      nyan: {
        options: {
          reporter: 'nyan'
        }
      },
      progress: {
        options: {
          reporter: 'progress'
        }
      },
      all: ['test/*.js']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'mochacli']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'mochacli']
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'mochacli']);
  grunt.registerTask('mocha', ['mochacli:spec']);
  grunt.registerTask('mocha-dot', ['mochacli:dot']);
  grunt.registerTask('mocha-progress', ['mochacli:progress']);
};
