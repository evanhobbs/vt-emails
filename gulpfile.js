var gulp 		= require('gulp');
var connect 	= require('gulp-connect');
var EmailTemplate = require('email-templates').EmailTemplate
var watch = require('gulp-watch');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var templatesDir = path.join(__dirname, 'templates');
var distDir = path.join(__dirname, 'preview', 'dist');


function startServer() {
	return connect.server({ 
	 	// base: __dirname, 
	 	root: 'preview',
	 	port: 4000, 
	 	// keepalive: false,
	 	livereload: true
	 });
}

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}

function renderEmail(name, data) {
	data = data || {};
	// var templateDir = path.join(__dirname, 'templates', name);
	// var distDir = path.join(__dirname, 'dist');
	var email = new EmailTemplate(templatesDir + '/' + name)

	if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

	email.render(data, function (err, results) {
		if (err) return console.log(err);
		if (results.html) fs.writeFile(distDir + '/' + name + '.html', results.html)
		if (results.text) fs.writeFile(distDir + '/' + name + '.text', results.text)
	})

}

function renderAll() {
	var dirs = getDirectories(path.join(__dirname, 'templates'));
	dirs.forEach(function(dir) {
		var data = require(path.join(templatesDir, dir, 'default.json'));
		renderEmail(dir, data);
	})	
}

gulp.task('dev', function() {
	var previewTemplate = require('./preview/index.ejs')
	fs.writeFile('./preview/index.html', previewTemplate({
		templates: [
			{ filename: 'dist/test.html', subject: 'test' }
		]
	}));

	startServer();
	renderAll();
	watch(['templates/**/*'], function() {
		renderAll();
		console.log('I should reload')
		connect.reload();
	})
	// renderEmail('test')
	// server();
	// browserSync();
});
