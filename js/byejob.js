var byejob = {

	KEY_CURRENT_DAY: "byejob.current.day",
	KEY_ENTRY_1: "byejob.entry1",
	KEY_ENTRY_2: "byejob.entry2",
	KEY_LEAVE_1: "byejob.leave1",
	KEY_LAST_WEATHER_CONSULT: "byejob.last.weather.consult",
	KEY_LAST_WEATHER_DESCRIPTION: "byejob.last.weather.description",
	KEY_LAST_TEMPERATURE: "byejob.last.temperature",
	KEY_LAST_CLOUDS: "byejob.last.clouds",

	jEntry1: null,
	jEntry2: null,
	jLeave1: null,
	jLeave2: null,
	jTolerance1: null,
	jTolerance2: null,

	expedient: null,
	temperature: null,
	weatherDescription: null,
	clouds: null,
	filters: {},

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
			self.loadWeather(position.coords.latitude, position.coords.longitude);
		});
	},

	loadWeather: function(latitude, longitude) {
		var self = this;
		if (self.isNeedRefreshWeather() === true) {
			var url = 'http://api.openweathermap.org/data/2.5/weather?lang=en&lat='
				+ latitude + '&lon=' + longitude
				+ '&APPID=8798ebb0cb4906589ca53da30af6f94e';

			var xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					var data = JSON.parse(xhr.response);
					console.log(data);

					var temperature = Math.round(data.main.temp - 273.15);
					var description = data.weather[0].description;
					var clouds = data.clouds.all;

					self.saveKeyLocalSession(self.KEY_LAST_TEMPERATURE, temperature);
					self.temperature = temperature;

					self.saveKeyLocalSession(self.KEY_LAST_WEATHER_DESCRIPTION, description);
					self.weatherDescription = description;

					self.saveKeyLocalSession(self.KEY_LAST_CLOUDS, clouds);
					self.clouds = clouds;

					self.saveKeyLocalSession(self.KEY_LAST_WEATHER_CONSULT, new Date().getTime());
					self.loadWeatherAnimation();
				}
			}
			xhr.send();
		} else {
			self.temperature = self.getKeyLocalSession(self.KEY_LAST_TEMPERATURE);
			self.weatherDescription = self.getKeyLocalSession(self.KEY_LAST_WEATHER_DESCRIPTION);
			self.clouds = self.getKeyLocalSession(self.KEY_LAST_CLOUDS);
			self.loadWeatherAnimation();
		}
	},

	isNeedRefreshWeather: function(){
		var lastConsult = parseInt(this.getKeyLocalSession(this.KEY_LAST_WEATHER_CONSULT));
		if(lastConsult > 0){
			var lastDate = new Date(lastConsult);
			var hours = parseInt(this.timeDifferenceBetween(this.getTimeString(lastDate), this.getTimeString(new Date())).split(":")[0]);
			return lastDate.getDate() != new Date().getDate() || hours > 0;
		}

		return true;
	},

	loadWeatherAnimation: function(){
		this.loadBackgroundAnimation();

		$('#first_page').fadeOut(function(){
			$('#content').fadeIn();
		});
	},

	loadBackgroundAnimation: function(){
		var backgroundClass;
		var grayscale = 100;
		var shadow = '#000';

		switch (this.weatherDescription) {
		case "shower rain":
		case "rain":
		case "thunderstorm":
			backgroundClass = "dark-cloud-day";
			grayscale = 100;
			shadow = '#000'
			break;

		case "broken clouds":
		case "scattered clouds":
			backgroundClass = "grey-cloud-day";
			grayscale = 75;
			shadow = '#363636'
			break;

		case "mist":
			backgroundClass = "foggy-day";
			grayscale = 50;
			shadow = '#E8E8E8'
			break;

		case "few clouds":
			backgroundClass = "white-cloud-day";
			grayscale = 25;
			shadow = '#E8E8E8'
				break;

		case "clear sky":
		case "Sky is Clear":
			backgroundClass = "clear-day";
			grayscale = 5;
			shadow = '#FFF'
			break;
		}

		this.filters['grayscale'] = grayscale;
		this.filters['shadow'] = shadow;
		this.loadFilters();
		$('.weather').addClass(backgroundClass);
	},

	loadFilters: function(){
		var webkitFilter = 'grayscale(' + this.filters['grayscale'] + '%) drop-shadow(0px 4px 8px ' + this.filters['shadow'] + ')';
		$('.plates').css('-webkit-filter', webkitFilter);
		$('.board').css('-webkit-filter', webkitFilter);
	},

	loadExpedient: function(){
		this.expedient = new Date();
		this.expedient.setHours(8, 30, 0, 0);
	},

	loadCurrentDay: function(){
		var self = this;
		var currentDay = self.getKeyLocalSession(self.KEY_CURRENT_DAY);

		if (currentDay) {
			if(currentDay == new Date().getDate()) {
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

		this.calculateLeave();
	},

	getTimeString: function(date){
		var time = new Date();
		time.setTime(date);
		var hours = time.getHours();
		var minutes = time.getMinutes();
		return (hours >= 10 ? hours : '0' + hours) + ":" + (minutes >= 10 ? minutes : '0' + minutes);
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

		var entry1 = new Date(parseInt(self.getKeyLocalSession(self.KEY_ENTRY_1)));
		var leave1 = new Date(parseInt(self.getKeyLocalSession(self.KEY_LEAVE_1)));
		var entry2 = new Date(parseInt(self.getKeyLocalSession(self.KEY_ENTRY_2)));

		var leave = "";
		var tolerance1 = "";
		var tolerance2 = "";

		if(!isNaN(entry1) && !isNaN(leave1) && !isNaN(entry2)){
			var firstRound = self.timeDifferenceBetween(self.getTimeString(entry1), self.getTimeString(leave1));
			var secondRound = self.timeDifferenceBetween(firstRound, self.getTimeString(self.expedient));
			leave = self.sumHours(self.getTimeString(entry2), secondRound);
			tolerance1 = self.timeDifferenceBetween("00:10", leave);
			tolerance2 = self.sumHours(leave, "00:10");
		}

		self.jLeave2.val(leave);
		self.jTolerance1.html(tolerance1);
		self.jTolerance2.html(tolerance2);
	},

	sumHours: function(start, end) {
	    var hourStart = start.split(':');
	    var hourEnd = end.split(':');

	    var hourTotal = parseInt(hourStart[0], 10) + parseInt(hourEnd[0], 10);
	    var minutesTotal = parseInt(hourStart[1], 10) + parseInt(hourEnd[1], 10);

	    if(minutesTotal >= 60){
	        minutesTotal -= 60;
	        hourTotal += 1;
	    }

	    return (hourTotal >= 10 ? hourTotal : '0' + hourTotal) + ":" + (minutesTotal >= 10 ? minutesTotal : '0' + minutesTotal);
	},

	timeDifferenceBetween: function(start, end) {
	    var hIni = start.split(':');
	    var hFim = end.split(':');

	    var hTotal = parseInt(hFim[0], 10) - parseInt(hIni[0], 10);
	    var mTotal = parseInt(hFim[1], 10) - parseInt(hIni[1], 10);

	    if(mTotal < 0){
	        mTotal += 60;
	        hTotal -= 1;
	    }

	    return (hTotal >= 10 ? hTotal : '0' + hTotal) + ":" + (mTotal >= 10 ? mTotal : '0' + mTotal);
	},

	saveCurrentDay: function(){
		this.saveKeyLocalSession(this.KEY_CURRENT_DAY, new Date().getDate());
	},

	saveTime: function(event){
		var self = this;
		var jEntry = $(event.target);
		var time = jEntry.val().trim();

		var value = null;
		if(time.length > 0){
			value = self.getTime(time).getTime();
		}

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

		self.calculateLeave();
	},

	saveKeyLocalSession: function(key, value){
		if(value) {
			localStorage.setItem(key, value);
		} else {
			localStorage.removeItem(key);
		}
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
		this.jTolerance1 = $('#tolerance_1');
		this.jTolerance2 = $('#tolerance_2');
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
				self.init();
			});
		}, 1500);
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