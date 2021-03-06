(function(win, doc, $, undefined){
    "use strict";
	
	//the first to run when document is ready
    $(function(){
		//stupid firefox bug
		$("#main-sidebar").toggle().toggle();
		
		//Create new AddVideoController
		new DirectPlayControllerIndex();			
	});

	//constroctor for this controller
	var DirectPlayControllerIndex = function(){
		this.Mediator 		= require("../Mediator.js").Mediator;
		
		var YoutubePlayer	= require("../model/YoutubePlayer.js").YoutubePlayer;	
		new YoutubePlayer(this.Mediator, 280, 200);
		
		var SearchMachine 	= require("../model/SearchMachine.js").SearchMachine;
		new SearchMachine(this.Mediator);

		var MessageBoard	= require("../model/MessageBoard.js").MessageBoard;	
		new MessageBoard(this.Mediator);
		
		this.Mediator.subscribe("resultsChange", resultsChange.bind(this));
		this.results 		= [];

		this.Mediator.subscribe("playerStateChange", playerStateChange.bind(this));
		this.Mediator.subscribe("resultsChange", resultsChange.bind(this));
		this.Mediator.subscribe("queueChanged", this.queueChanged.bind(this));
	
		this.initUI();
	};

	//bind and set attr on UI controls
	DirectPlayControllerIndex.prototype.initUI = function(){
		var that = this;
		this.resultEl       	= $("#video-list");
		this.queueToggleEl 		= $("#queue-toggle");

		this.searchEl       = $("#search")
		.on("keypress", this.searchKeypress.bind(this));
   		
		this.constraintEl   = $("#constraints")
		.on("keyup", this.constrKeypress.bind(this))
		.attr("title","By typing here you sort out what is shown in the list");
		
		this.searchOptionEl = $("#search-option")
		.attr("title","Video search is the standard search, playlistsearch is better when searcrching for albums or collections of videos");
		
		$("#sort-category-1")
		.on("click", function(){
			that.sortOnCategory(1);
		});

		$("#sort-category-2")
		.on("click", function(){
			that.sortOnCategory(2);
		});

		$("#sort-category-3")
		.on("click", function(){
			that.sortOnCategory(3);
		});

		$("#home").attr("href", "http://www.youdify.com");
		
		$("#empty-queue")
		.on("click", function(){
			that.Mediator.write("emptyQueue");
		})
		.attr("title","Empty the queue");
		
		$("#next")
		.on("click", this.forward.bind(this))
		.attr("title","Play the next video");
		
		$("#prev")
		.on("click", this.previous.bind(this))
		.attr("title","Play previous video");

		$("#show-queue")
		.on("click", this.showQueue.bind(this));

		this.playEl 		= $("#play")
		.on("click", this.play.bind(this))
		.attr("title","Play or pause video");

		this.shuffleEl		= $("#shuffle")
		.on("click", this.toggleShuffle.bind(this))
		.attr("title","Toggle shuffle");
		
		this.autoplayEl		= $("#autoplay")
		.on("click", this.toggleAutoplay.bind(this))
		.attr("title","Toggle autoplay, if autoplay is enabled player will keep playing when queue is empty");
		
		this.repeatEl		= $("#repeat")
		.on("click", this.toggleRepeat.bind(this))
		.attr("title","Toggle repeat one");
	};
	
	//sort the results
	DirectPlayControllerIndex.prototype.sortOnCategory = function(category){	
		var tempArr = this.results;
		if (category===1){
			tempArr.sort(
				function(a,b){
						return b.views-a.views;
				}
			);
		} else if (category===2){
			tempArr.sort(
				function(a,b){
						return b.durationSec - a.durationSec;
				}
			);
		} else if (category===3){
			tempArr.sort(
				function(a,b){
						return b.average - a.average;
				}
			);
		};

		this.clear();
		for (var i = 0; i < tempArr.length; ++i){
			this.generateResultDiv(tempArr[i]);
		}
	};

	//creates a new video element and append it to the list
	DirectPlayControllerIndex.prototype.generateResultDiv = function(video){
		var that = this;

		this.results.push(video);
		this.Mediator.write("resultsChange", this.results);
		
		var element = $("#video-tempelate").clone().show().attr("id","")[0];

        $(element).find(".title")
		.html(video.title).on("click", function(){
			that.Mediator.write("play", video);	
		});
	
		//add action for queue last
		$(element).find(".add-last-to-queue").on("click", function(){
			that.Mediator.write("queueVideoLast", video);
			$(this.parentNode).hide(200);
		});
		
		$(element).find(".toggle-video-options")
		.on("click", function(){
			$(element).find(".video-options").toggle(200);		
		});

		//add action for queue first
		$(element).find(".add-first-to-queue").on("click", function(){
			that.Mediator.write("queueVideoFirst", video);
			$(this.parentNode).hide(200);
		});

		//add action for remove (hide/remove)
		$(element).find(".hide-video").on("click", function(){
			var obj = {
				"id":video.id,
				"name":that.playlistName
			}
			if (isAuthenticated){
				that.Mediator.write("deleteVideo", obj);
				$(element).hide(100);
			}
			else{
				$(element).hide(100);
			}
		});

		//set properties of video element
		$(element).find(".thumb").attr("src", video.thumb);
		$("<h4></h4>").text(video.category).appendTo($(element).find(".subtitle"));
		$("<h4></h4>").text("Duration : " + video.duration).appendTo($(element).find(".subtitle"));
		$("<h4></h4>").text("Views : " + video.views).appendTo($(element).find(".subtitle"));
		$("<h4></h4>").text("Likes : " + video.likes).appendTo($(element).find(".subtitle"));
		$("<h4></h4>").text("Dislikes : " + video.dislikes).appendTo($(element).find(".subtitle"));

		//generates a preview element shown in "show queue etc"
		var preview 	= doc.createElement("div"),
			prevThumb	= $(element).find(".thumb").clone(),
			prevTitle 	= doc.createElement("h4"),
			title		= video.title,
			remove 		= doc.createElement("a");
		
		if (title.length >= 15){
			title = title.slice(0,12);
			title += "...";
		}

		$(preview).addClass("grid-1 preview");

		$(remove)
		.addClass("remove fontawesome-remove")
		.appendTo(preview);

		$(preview).on("click", function(){
			that.Mediator.write("removeVideoFromQueue", video);
		});

		$(prevThumb)
		.appendTo(preview);
	
		$(prevTitle).html(title)
		.addClass("subtitle")
		.appendTo(preview);

		video.preview = preview;
		video.element = element;
		this.resultEl.append(element);
	};

	//triggers when enter is pressed in searchEl
	DirectPlayControllerIndex.prototype.searchKeypress = function(event){
		var query = this.searchEl.val(),
			that = this,
			object ={
				query : query, 
				callback : function(video){ 
					var found = that.checkIfExist(video);
					if (!found && video.title!=="Private video"){
						that.generateResultDiv(video);
					}
				}
			}

		if (event.which == 13) {
			this.clear();

			//if radiobutton is on playlist, the search searches for playlists
			if (!this.searchOptionEl.is(":checked")){
				this.Mediator.write("loadPlaylists", object);
			}

			//if radiobutton is on videos we do a normal search
			else{
				this.Mediator.write("loadVideos", object);
			}
		}
	};
	
	//check if a specific videoId exist in results array
	DirectPlayControllerIndex.prototype.checkIfExist = function(video){
		var found = false;
		for (var i = 0; i < this.results.length; i++){
			if (video.id === this.results[i].id){
				found = true;
			};
		}
		return found;
	};

	//bound to playbutton
	DirectPlayControllerIndex.prototype.play = function(){
		$(this.playEl).toggleClass("active");
		this.Mediator.write("play");
		return false;
	};

	//bound to nextbutton
	DirectPlayControllerIndex.prototype.forward = function(){
		this.Mediator.write("playNext");
		return false;
	};

	//bound to previous button
	DirectPlayControllerIndex.prototype.previous = function(){
		this.Mediator.write("playPrev");
		return false;
	};
	
	//bound to shuffle button
	DirectPlayControllerIndex.prototype.toggleShuffle = function(){
		this.Mediator.write("toggleShuffle");
		$(this.shuffleEl).toggleClass("active");
		return false;
	};

	//bound to autoplay button (keep playing when list/queue is empty)
	DirectPlayControllerIndex.prototype.toggleAutoplay = function(){
		this.Mediator.write("toggleAutoplay");
		$(this.autoplayEl).toggleClass("active");
		return false;
	};

	//called when queue changes, updates the queue element
	DirectPlayControllerIndex.prototype.queueChanged = function(newQueue){
		var toggleEl = $("#show-queue");
		toggleEl.html("Queue (" + newQueue.length + ")");
		
		this.queueToggleEl.find(".preview").remove();
		toggleEl.show(400);
		for (var i=0; i < newQueue.length; ++i){
			this.queueToggleEl.append(newQueue[i].preview);
		}
	};

	//show the queue
	DirectPlayControllerIndex.prototype.showQueue = function(){
		this.queueToggleEl.toggle(200);
	};

	//bound to repeat button
	DirectPlayControllerIndex.prototype.toggleRepeat = function(){
		this.Mediator.write("toggleRepeat");
		$(this.repeatEl).toggleClass("active");
		return false;
	};

	//triggers when constraints keyup
	DirectPlayControllerIndex.prototype.constrKeypress = function(event){
		var key = event.which,
			that = this,
			backspace = key == 8,
			constraints = this.constraintEl.val().split(","),
			constraint = constraints[constraints.length - 1];
			
		if (constraint.length == 0 && constraints.length ==0){
			$(".video").show();
			return;
		}

		//triggers when we are inbetween two keywords
		if (constraint.length == 0){
			//input box is empty
			if (constraints.length <= 1){
				that.results.forEach(function(video){
					if (isHidden(video)){
						show(video);
					}
				});
				return;
			}
			else{
				backspace = true;
			}
		}

		if (constraint.indexOf("-")==0){
			constraint = constraint.replace("-","");
				if(constraint.length!==0){
					this.results.forEach(function(video){
						if (video.title.toLowerCase().indexOf(constraint) !== -1){
							hide(video);
						}else if (backspace){
							show(video);
						}
					});
				}
		}
		else {
			constraint = constraint.replace("+","");
			if(constraint.length!==0){
				this.results.forEach(function(video){
					if (video.title.toLowerCase().indexOf(constraint) == -1){
						hide(video);
					}else if (backspace){
						show(video);
					}
				});
			}
		}
	};

	//clears result and all the video-elements
	DirectPlayControllerIndex.prototype.clear = function(){
		$(this.resultEl).empty();
		this.results = [];
		this.Mediator.write("resultsChange", this.results);
	};
	
	var hide = function(video){
		return $(video.element).hide();
	}	

	var show = function(video){
		return $(video.element).show();
	}	

	var isHidden = function(video){
		return video.element.style.display === "none";
	}	

	//update results when it changes
	var resultsChange = function(results){
		this.results = results;
	};
	
	//state changed on player, do something with ui
	var playerStateChange = function(object){
		this.isPlaying = object.newState===1;
		//-3 (previous pressed)
		//-2 (videos removed)
		//-1 (unstarted)
		//0 (ended)
		//1 (playing)
		//2 (paused)
		//3 (buffering)
		//5 (video cued)
		switch(object.newState)
		{
			case 0:
				this.Mediator.write("playNext");
				break;
			case 1:
				this.Mediator.write("permanentMessage", "Playing video " + object.current.title);
				$(this.playEl).addClass("active");
				break;
			case 2:
				this.Mediator.write("permanentMessage", "Video paused");
				$(this.playEl).removeClass("active");
				break;
			case 3:
				break;
		}
	}


})(window, document, jQuery);
