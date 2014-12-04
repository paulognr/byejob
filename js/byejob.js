var byejob = {

	KEY_CURRENT_DAY: "byejob.current.day",
	KEY_ENTRY_1: "byejob.entry1",
	KEY_ENTRY_2: "byejob.entry2",
	KEY_LEAVE_1: "byejob.leave1",

	jEntry1: null,
	jEntry2: null,
	jLeave1: null,
	jLeave2: null,

	expedient: null,

	init : function() {
		this.loadExpedient();
		this.loadJqueryObjects();
		this.loadEvents();
		this.loadCurrentDay();
		this.loadPosition();
	},
	
	loadPosition: function() {
		var self = this;
		navigator.geolocation.getCurrentPosition(function(position){
			self.loadWeather(position.coords.latitude+','+position.coords.longitude);
		});
	},
	
	loadWeather: function(location, woeid){
		$.simpleWeather({
			location: location,
			woeid: woeid,
			unit: 'c',
			success: function(weather) {
				console.log(weather.code);
				console.log(weather.temp);
				console.log(weather.units.temp);
				console.log(weather.city);
				console.log(weather.region);
				console.log(weather.currently);
				console.log(weather.alt.temp);
			}
	  });
	},

	loadExpedient: function(){
		this.expedient = new Date();
		this.expedient.setHours(8, 30, 0, 0);
	},

	loadCurrentDay: function(){
		var self = this;
		var currentDay = self.getKeyLocalSession(self.KEY_CURRENT_DAY);

		if (currentDay) {
			if(currentDay == new Date().getDay()) {
				self.loadTimes();
			} else {
				self.reseteTimes();
			}
		} else {
			self.saveCurrentDay();
		}
	},

	loadTimes: function(){
		var entry1 = this.getKeyLocalSession(this.KEY_ENTRY_1);
		if(entry1){
			this.jEntry1.val(this.getTimeString(entry1));
		}

		var entry2 = this.getKeyLocalSession(this.KEY_ENTRY_2);
		if(entry2){
			this.jEntry2.val(this.getTimeString(entry2));
		}

		var leave1 = this.getKeyLocalSession(this.KEY_LEAVE_1);
		if(leave1){
			this.jLeave1.val(this.getTimeString(leave1));
		}
	},

	getTimeString: function(date){
		var time = new Date();
		time.setTime(date);
		var hours = time.getHours();
		var minutes = time.getMinutes();
		return (hours > 10 ? hours : '0' + hours) + ":" + (minutes > 10 ? minutes : '0' + minutes);
	},

	reseteTimes: function(){
		localStorage.removeItem(this.KEY_ENTRY_1);
		this.jEntry1.val("");

		localStorage.removeItem(this.KEY_ENTRY_2);
		this.jEntry2.val("");

		localStorage.removeItem(this.KEY_LEAVE_1);
		this.jLeave1.val("");

		this.saveCurrentDay();
	},

	calculateLeave: function(){
		var self = this;

		var entry1 = parseInt(self.getKeyLocalSession(self.KEY_ENTRY_1));
		var leave1 = parseInt(self.getKeyLocalSession(self.KEY_LEAVE_1));
		var entry2 = parseInt(self.getKeyLocalSession(self.KEY_ENTRY_2));

		var result = self.expedient.getTime() - (leave1 - entry1) + entry2;

		self.jLeave2.html(self.getTimeString(result));
	},

	saveCurrentDay: function(){
		this.saveKeyLocalSession(this.KEY_CURRENT_DAY, new Date().getDay());
	},

	saveTime: function(event){
		var self = this;
		var jEntry = $(event.target);
		var time = jEntry.val().trim();

		if(time.length > 0){
			var value = self.getTime(time).getTime();
			var data = jEntry.data('entry');
			if (data) {
				if (data == 1) {
					self.saveKeyLocalSession(self.KEY_ENTRY_1, value);
				} else if(data == 2) {
					self.saveKeyLocalSession(self.KEY_ENTRY_2, value);
				}
			} else {
				var data = jEntry.data('leave');
				if (data && data == 1) {
					self.saveKeyLocalSession(self.KEY_LEAVE_1, value);
				}
			}
		}

		self.calculateLeave();
	},

	saveKeyLocalSession: function(key, value){
		localStorage.setItem(key, value);
	},

	getKeyLocalSession: function(key){
		return localStorage.getItem(key);
	},

	getTime: function(time){
		var timeArray = time.split(":");
		var date = new Date();
		date.setHours(timeArray[0]);
		date.setMinutes(timeArray[1]);
		date.setSeconds(0);
		date.setMilliseconds(0);
		return date;
	},

	loadJqueryObjects: function(){
		this.jEntry1 = $('#entry_1');
		this.jEntry2 = $('#entry_2');
		this.jLeave1 = $('#leave_1');
		this.jLeave2 = $('#leave_2');
	},

	loadEvents: function(){
		var self = this;
		self.jEntry1.on('blur', function(event){
			self.saveTime(event);
		});

		self.jEntry2.on('blur', function(event){
			self.saveTime(event);
		});

		self.jLeave1.on('blur', function(event){
			self.saveTime(event);
		});
	},

	loadJsFiles: function(){
		var self = this;
		setTimeout(function(){
			self.loadJsFile("../js/jquery-2.1.1.min.js", function(){
				self.loadJsFile("../js/jquery.simpleWeather.min.js", function(){
					self.init();
				});
			});
		}, 1000);
	},

	loadJsFile: function(filename, callback){
		var fileref=document.createElement('script');
		fileref.setAttribute("type","text/javascript");
		fileref.setAttribute("src", filename);
		fileref.onload = callback;
		document.getElementsByTagName("head")[0].appendChild(fileref);
	}
};

document.addEventListener('DOMContentLoaded', function() {
	byejob.loadJsFiles();
});