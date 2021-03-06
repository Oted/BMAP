port = 3000;
host = "82.196.12.214";
dbName = "test";

var express = require("express"),
	httpProxy = require("http-proxy"),
    http  = require('http'),
	app = express(),
	flash = require('connect-flash'),
	routes = require("./routes/index"),
	mongoose = require("mongoose"),
	db = mongoose.connection,
	io = require("socket.io").listen(app.listen(port)),
	passport = require("passport"),
	authenticator = require("./my_modules/authenticator.js");
	socket = require("./my_modules/socket.js").init(io),
	throttler = require("./my_modules/throttler.js");

var proxy = httpProxy.createServer({});

http.createServer(function(req, res) {
    proxy.web(req, res, {target : 'http://localhost:' + port});
}).listen(80);

proxy.on('error', function (error, req, res) {
    var json;
    console.log('proxy error', error);
    
    if (!res.headersSent) {
        res.writeHead(500, { 'content-type': 'application/json' });
    }

    json = { error: 'proxy_error', reason: error.message };
    res.end(JSON.stringify(json));
});

//connects to database
mongoose.connect("mongodb://" + host + "/" + dbName);
db.on('error', console.error.bind(console, 'connection error:'));


//opens database, on success set express configurations
db.once('open', function callback(){
	console.log("Database successfuly opened\nExpress and socket is now listening on port "+ host + ":" + port);

	//set up app configurations
	app.use(express.favicon(__dirname + '/public/images/favicon.ico')); 
	app.set("view engine", "ejs");	
	app.use(express.static(__dirname + '/public'));
	app.enable('trust proxy');
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.session({secret: "william",cookie : {maxAge: 360000000}}));
	app.use(flash());
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
	
	//Rendering calls
	app.get("/", throttler(), routes.index);
	app.get("/add/*", throttler(), routes.add);
	app.get("/index.html", throttler(), routes.index);
	app.get("/directplay/*", throttler(), routes.directplay);
	app.get("/redirector/*", throttler(), routes.redirector);
	app.get("/playlists/*", throttler(), routes.playlist(false));

	//authentication rendering of playlist
	app.post("/auth", throttler(),
		passport.authenticate("local", { failureFlash: false }),
		//on auth success
		function(req, res) {
			var sId = req.sessionID,
				playlistName = req.body.username,
				doc = {};

			authenticator.add(sId, playlistName);
		
			doc.name = req.user.name;
			doc.description = req.user.description;
			doc.freetag = req.user.freetag;
			doc.category = req.user.category;
			doc.locked = req.user.locked;
	
			console.log(req.user);
			res.send({"auth":true,"doc":doc})
		}
	);
	
	//Api calls
	app.get("/checkifexist/*", routes.checkIfExist);
	app.get("/getplaylists/*", routes.getPlaylists);
	app.get("/createnewplaylist/*", throttler(), routes.createNewPlaylist);
	app.get("/updateplaylist/*", throttler(), routes.updatePlaylist);
	app.get("/push/*", throttler(), routes.push);
	app.get("/deletevideo/*", routes.deleteVideo);
	app.get("/searchplaylistsbyname/*", throttler(), routes.searchPlaylistsByName);
	app.get("/searchplaylistsbyfreetag/*", throttler(), routes.searchPlaylistsByFreetag);
});

//on exit, close database
process.on('exit', function() {
	console.log("About to exit.");
	console.log("Closing database");
	mongoose.connection.close();
});
