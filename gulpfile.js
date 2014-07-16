'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// Watch Files For Changes & Reload
gulp.task('serve', function () {
  browserSync.init({
    server: {
      baseDir: ['app', '.tmp']
    },
    notify: false
  });

  gulp.watch(['app/*.html'], reload);
  gulp.watch(['app/js/**/*.js'], reload);
});