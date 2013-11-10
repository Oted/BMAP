var dbHandler = require("../model/playlist.js");
var socket = require("../socket.js");

//render view for local playlist
exports.index = function(req, res){
console.log("Rendering index for " + req.ip);
 	dbHandler.getAll(function (doc) {
		console.log(doc[0]);
		res.render("index",{ playlists: doc });
	});
};

//render view for adding new songs
exports.add = function(req, res){
	var name = req.query.name;
	console.log("Rendering add view for " + req.ip + " pushing to playlist " + name);
	res.render("overlay",{name : name});
};

//render view for shared playlist
exports.playlists = function(req, res){
var client = req.ip;
var name = req.params[0].replace("+"," ");
	dbHandler.checkIfExist(name, function(data){
		if (data.found){
			res.render("shared",{
				name : name,
				client : client,
				host: host,
				port: port
			});
		}
		else {
			res.send("no such playlist");
		}
	});
};

//Api-call for checking if playlist exists
exports.checkIfExist = function(req, res){
	var name = req.query.name.replace("+"," ");
	dbHandler.checkIfExist(name, function(data){
		res.jsonp({"found" : data.found});
	});
};

//Api-call for creating new playlist
exports.createNewPlaylist = function(req, res){
	var client = req.ip;
	var name = req.query.name.replace("+"," ");
	dbHandler.createNewPlaylist(name, client, function(created){
		res.jsonp({"created" : created});
	});
};

//Api-call for pushing new videos to playlist
exports.push = function(req, res){
	var client = req.ip;
	var name = req.params[0].replace("+"," ");
	var video = req.query.video;
	dbHandler.push(name, client, video, function(){
		socket.pushOne(video, name);
	});
};
