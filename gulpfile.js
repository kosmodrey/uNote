'use strict';

const
  gulp = require('gulp'),
  zip = require('gulp-zip');

gulp.task('default', x => {

  const source = gulp.src('src/**');

  // Build for Mozilla Firefox
  // source
  //   .pipe(zip('uNote.xpi'))
  //   .pipe(gulp.dest('build/firefox/'));

  // Build for Google Chrome
  // Build for Opera/Yandex.Browser
  // Build for Microsoft Edge

});
