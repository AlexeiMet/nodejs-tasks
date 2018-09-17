const gulp = require('gulp');
const babel = require('gulp-babel');
const nodemon = require('gulp-nodemon');

gulp.task('build', () =>
  gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'))
);

gulp.task('dev', ['build'], () =>
  nodemon({
    script: 'dist/index.js',
    watch: 'src',
    legacyWatch: true,
    tasks: ['build']
  })
);

gulp.task('test', () => {
  gulp.watch('test/**/*', () => {
    console.log('test changed');
  });
});
