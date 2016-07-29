var gulp = require('gulp');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var umd = require('gulp-umd');
var es = require('event-stream');

gulp.task('build', function () {
  var server = gulp.src('./src/server.js')
    .pipe(umd({
      exports: function () { return 'PortalServer'; },
      namespace: function () { return 'PortalServer'; }
    }))
    .pipe(rename('portal.server.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('./dist'));

  var client = gulp.src('./src/client.js').pipe(umd({
      exports: function () { return 'PortalClient'; },
      namespace: function () { return 'PortalClient'; }
    }))
    .pipe(rename('portal.client.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('./dist'));

    return es.concat(client, server);
});
