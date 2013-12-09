var fs = require('fs');
var xml2js = require('xml2js');
var db = require('./db');

var data1 = fs.readFileSync(__dirname + '/classes.xml');
var data2 = fs.readFileSync(__dirname + '/funcoes.xml').toString();

var parser = new xml2js.Parser();

db.query('delete from fonte; delete from classe; delete from funcao; delete from arquivo', 
  function (err, results, close) {
 	if (err) { throw err; }
 	close();
	parser.parseString(data1, function (err, result) {
		if (err) { throw err; }
		(function f (i) {
			var index = 0, index2, obj, functions = [];
			if (i >= result.clones.class.length) {
				while (true) {
					obj = {};
					index = data2.indexOf('file="', index);
					if (index === -1) break;
					index2 = data2.indexOf('"', index + 6)
					obj.file = data2.substr(index + 6, index2 - index - 6);
					index = data2.indexOf('startline="', index);
					index2 = data2.indexOf('"', index + 11)
					obj.startline = data2.substr(index + 11, index2 - index - 11);
					index = data2.indexOf('endline="', index);
					index2 = data2.indexOf('"', index + 9)
					obj.endline = data2.substr(index + 9, index2 - index - 9);
					index = index2 + 1;
					functions.push(obj);
				}
				(function _f (j) {
					if (j >= functions.length) {
						db.query('insert into arquivo (file) \
								SELECT distinct file FROM md.fonte', 
							function (err, result, close__) {
								close__();
								db.end();
							}
						);
						return;
					}
					db.query('insert into funcao (file, startline, endline) \
							values (?,?,?)', 
						[functions[j].file, 
							parseInt(functions[j].startline), 
							parseInt(functions[j].endline)],
						function (err, result, close___) {
							if (err) { throw err; }
							close___();
							console.log(j + 1);
							_f(j + 1);
						}
					);
				})(0);
				return;
			}
			var classe = result.clones.class[i].$;
			var source = result.clones.class[i].source;
			var query = '';
			var params = [ parseInt(classe.classid), 
				parseInt(classe.nlines), 
				parseInt(classe.similarity) ];
			var j;
			for (j = 0; j < source.length; j += 1) {
				query += '; insert into fonte(classe, file, pcid, startline, endline) \
					values (?,?,?,?,?)';
				params.push(classe.classid,
					source[j].$.file,
					parseInt(source[j].$.pcid),
					parseInt(source[j].$.startline),
					parseInt(source[j].$.endline));
			}
			db.query('insert into classe values (?,?,?)' + query, params, 
				function (err, result, close_) {
					if (err) { throw err; }
					close_();
					console.log(i + 1);
	  			f(i + 1)
	  		}
	  	);
		})(0);
	});
  }
);