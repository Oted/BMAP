var dbHandler = require("./model/playlist.js");
var that = this;

//init
exports.init = function(io){
	that.io = io;
	io.sockets.on("connection", function (socket) {
		socket.emit("register", {message:"Hello and welcome"});	
		
		socket.on("ok", function(data){
			console.log("client " + data.client + " is now registered to playlist " + data.name); 		
			socket.join(data.name+"");
			that.pushAll(socket, data.name, data.client);
		});
	});
};

//chat message received
exports.chatMessage = function(name, message, client){
	that.io.sockets.in(name+"").emit("chatMessage", {message: message, client: client})
};

//push one new video to all clients in the same room (attached to the same playlist)
exports.pushOne = function(video, name){
	that.io.sockets.in(name+"").emit("push", {video: video});
}

//push all videos in a playlist to a client (used when a new client connect)
exports.pushAll = function(socket, name, client){
	dbHandler.get(name,function(videos){
		videos.forEach(function(video){	
			//that.socket.emit("push",{video: v});	
			socket.emit("push", {video: video});
		});
	});
};

exports.chatMessage = function(){
 	

};
