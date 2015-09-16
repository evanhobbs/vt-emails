var gulp 		= require('gulp');
var connect 	= require('gulp-connect');
var EmailTemplate = require('email-templates').EmailTemplate
var watch = require('gulp-watch');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var templatesDir = path.join(__dirname, 'templates');
var distDir = path.join(__dirname, 'preview', 'dist');
var sendmail = require('gulp-mailgun');
var minimist = require('minimist');

var args = minimist( process.argv.slice(2) );

function startServer() {
	return connect.server({ 
	 	// base: __dirname, 
	 	root: 'preview',
	 	port: 4000, 
	 	// keepalive: false,
	 	livereload: true
	 });
}

function getDirContents(srcpath, type) {
	type = type || 'directories'
	return fs.readdirSync(srcpath).filter(function(file) {
		var result = fs.statSync(path.join(srcpath, file)).isDirectory();
		if (type === 'directories') return result;
		if (type === 'files') return !result;
	});
}

function renderEmail(name, data) {
	data = data || {};
	// var inkCss = fs.readFileSync('css/ink.css', { encoding: 'utf8'});
	// console.log(inkCss)
	var email = new EmailTemplate(templatesDir + '/' + name, {
		juiceOptions: {
			preserveMediaQueries: true,
			removeStyleTags: true,
			applyAttributesTableElements: true,
			applyWidthAttributes: true,
			preserveImportant: true
		}
	})

	if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

	email.render(data, function (err, results) {
		if (err) return console.log(err);
		if (results.html) fs.writeFile(distDir + '/' + name + '.html', results.html)
		if (results.text) fs.writeFile(distDir + '/' + name + '.txt', results.text)
	})

}

function renderAll() {
	var dirs = getDirContents(path.join(__dirname, 'templates'));
	dirs.forEach(function(dir) {
		var data = require(path.join(templatesDir, dir, 'defaults.json'));
		console.log(data)
		renderEmail(dir, data);
	})	
}

function createPreview() {
	var templates = [];
	var previewTemplate = require('./preview/index.ejs')
	//get the rendered templates
	var files = getDirContents(path.join(__dirname, 'preview/dist'), 'files');
	files.forEach(function(file) {
		templates.push({ filename: 'dist/' + file, subject: file });
	})

	fs.writeFile('./preview/index.html', previewTemplate({
		templates: templates
	}));	
}

gulp.task('dev', function() {
	renderAll();
	createPreview();
	startServer();

	watch(['include/**/*', 'templates/**/*', 'css/**/*'], function() {
		renderAll();
		createPreview();
		gulp.src('preview/index.html').pipe(connect.reload())
	})
});

gulp.task('sendmail', function () {
	renderAll();
  gulp.src( 'preview/dist/'+args.email+'.html') // Modify this to select the HTML file(s)
  .pipe(sendmail({
    key: 'key-0112db83ab5a478350ed86394c666007', // Enter your Mailgun API key here
    sender: 'test@vt.com',
    recipient: args.to || 'evanhobbs@gmail.com',
    subject: 'This is a test email'
  }));
});
