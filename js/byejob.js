var byejob = {

	KEY_CURRENT_DAY: "byejob.current.day",
	KEY_ENTRY_1: "byejob.entry1",
	KEY_ENTRY_2: "byejob.entry2",
	KEY_LEAVE_1: "byejob.leave1",
	KEY_LAST_WEATHER_CONSULT: "byejob.last.weather.consult",
	KEY_LAST_WEATHER_DESCRIPTION: "byejob.last.weather.description",
	KEY_LAST_TEMPERATURE: "byejob.last.temperature",
	KEY_LAST_CLOUDS: "byejob.last.clouds",
	KEY_LAST_WIND_SPEED: "byejob.last.wind.speed",

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
	windSpeed: null,
	filters: {},
	latitude: null,
	longitude: null,

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
			self.latitude = position.coords.latitude;
			self.longitude = position.coords.longitude;
			self.loadWeather();
		});
	},

	loadWeather: function() {
		var self = this;
		if (self.isNeedRefreshWeather() === true) {
			var url = 'http://api.openweathermap.org/data/2.5/weather?lang=en&lat='
				+ self.latitude + '&lon=' + self.longitude
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
					var windSpeed = data.wind.speed;

					self.saveKeyLocalSession(self.KEY_LAST_TEMPERATURE, temperature);
					self.temperature = temperature;

					self.saveKeyLocalSession(self.KEY_LAST_WEATHER_DESCRIPTION, description);
					self.weatherDescription = description;

					self.saveKeyLocalSession(self.KEY_LAST_CLOUDS, clouds);
					self.clouds = clouds;

					self.saveKeyLocalSession(self.KEY_LAST_WIND_SPEED, windSpeed);
					self.windSpeed = windSpeed;

					self.saveKeyLocalSession(self.KEY_LAST_WEATHER_CONSULT, new Date().getTime());
					self.loadWeatherAnimation();
				} else {
					self.loadWeather();
				}
			}
			xhr.send();
		} else {
			self.temperature = self.getKeyLocalSession(self.KEY_LAST_TEMPERATURE);
			self.weatherDescription = self.getKeyLocalSession(self.KEY_LAST_WEATHER_DESCRIPTION);
			self.clouds = self.getKeyLocalSession(self.KEY_LAST_CLOUDS);
			self.windSpeed = self.getKeyLocalSession(self.KEY_LAST_WIND_SPEED);
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
		var self = this;
		self.loadBackgroundAnimation();
		self.loadBackgroundCloudsSpeed();
		self.loadSunlight();
		self.loadRain();

		$('#first_page').fadeOut(function(){
			$('#content').fadeIn(function(){
				self.loadClouds();
			});
		});

	},

	loadBackgroundAnimation: function(){
		var backgroundClass;
		var grayscale = 100;
		var shadow = '#000';

		switch (this.weatherDescription.toLowerCase()) {
		case "shower rain":
		case "rain":
		case "thunderstorm":
			backgroundClass = "dark-cloud-day";
			grayscale = 100;
			shadow = '#000'
			break;

		case "moderate rain":
		case "broken clouds":
			backgroundClass = "grey-cloud-day";
			grayscale = 75;
			shadow = '#363636'
			break;

		case "light rain":
		case "mist":
			backgroundClass = "foggy-day";
			grayscale = 50;
			shadow = '#E8E8E8'
			break;

		case "heavy intensity rain":
		case "scattered clouds":
		case "overcast clouds":
		case "few clouds":
			backgroundClass = "white-cloud-day";
			grayscale = 25;
			shadow = '#E8E8E8'
				break;

		case "clear sky":
		case "sky is clear":
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
		$('.rope').css('-webkit-filter', webkitFilter);
	},

	loadSunlight: function(){
		var self = this;
		var sunPosition;
		switch (self.weatherDescription.toLowerCase()) {
		case "heavy intensity rain":
		case "scattered clouds":
		case "overcast clouds":
		case "few clouds":
		case "clear sky":
		case "sky is clear":
			sunPosition = SunCalc.getPosition(new Date(), self.latitude, self.longitude);
			var altitude = sunPosition.altitude * 100;
			var radius = sunPosition.azimuth * 180 / Math.PI;

			if (radius < 0) {
				radius = radius < 0 ? radius * -1 - 60 : radius;
			} else {
				radius = radius > 0 ? 180 - radius + 180 : radius;
			}

			$('#sun').css('top', 160 - (148 / 370 * 6 * altitude))
					.css('left', 420 - (640 / 300 * radius));
			break;
		}
	},

	loadBackgroundCloudsSpeed: function(){
		this.changeFullbgKeyFrame();
	},

	loadRain: function(){
		var self = this;

		switch (self.weatherDescription.toLowerCase()) {
		case "moderate rain":
		case "thunderstorm":
		case "shower rain":
		case "light rain":
		case "rain":
			$('.rain').fadeIn();
			$('.raindrops').fadeIn();
			break;
		}
	},

	loadClouds: function(){
		var jWeather = $('.weather'),
		jCloud1 = $('#cloud_1'),
		jCloud2 = $('#cloud_2'),
		jCloud3 = $('#cloud_3'),
		jCloud4 = $('#cloud_4'),
		cloudPath = "url(../img/weather/cloud",
		loadClouds = false;

		if(jWeather.hasClass('white-cloud-day')){
			cloudPath += "/white/white_cloud_day_";
			loadClouds = true;
		} else if(jWeather.hasClass('grey-cloud-day') || jWeather.hasClass('foggy-day')){
			cloudPath += "/grey/grey_cloud_day_";
			loadClouds = true;
		} else if(jWeather.hasClass('dark-cloud-day')){
			cloudPath += "/dark/dark_cloud_day_";
			loadClouds = true;
		}

		if(loadClouds === true){
			if(this.clouds >= 20 && this.clouds < 40){
				this.addCloud(jCloud1, cloudPath, 1);
			} else if(this.clouds >= 40 && this.clouds < 60){
				this.addCloud(jCloud1, cloudPath, 1);
				this.addCloud(jCloud2, cloudPath, 2);
			} else if(this.clouds >= 60 && this.clouds < 80){
				this.addCloud(jCloud1, cloudPath, 1);
				this.addCloud(jCloud2, cloudPath, 2);
				this.addCloud(jCloud3, cloudPath, 3);
			} else {
				this.addCloud(jCloud1, cloudPath, 1);
				this.addCloud(jCloud2, cloudPath, 2);
				this.addCloud(jCloud3, cloudPath, 3);
				this.addCloud(jCloud4, cloudPath, 4);
			}
		}
	},

	addCloud: function(jCloud, cloudPath, index){
		var self = this;
		jCloud.css('background-image', cloudPath + index + '.png)');
		jCloud.css('top', self.getRandom(-70, 140) + 'px');
		jCloud.css('left', self.getRandom(-250, 350) + 'px');
		jCloud.fadeIn(function(){
			self.initAllCloudsKeyFrame();
		});

		setInterval(function(){
			if(jCloud.position().left > 440){
				self.resetCloudKeyFrame(jCloud);
			}
		}, 1000);
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

	getRandom: function(start, end){
		return Math.floor(Math.random() * end) + start;
	},

	getBackgroundCloudsSpeed: function(){
		if(this.windSpeed < 2){
			return 0;
		}

		if(this.windSpeed > 29){
			return 6000;
		}

		return 6000 / 60 * this.windSpeed + 1000;
	},

	changeFullbgKeyFrame: function()
    {
        var keyframes = this.findKeyframesRule("fullbg");

        keyframes.deleteRule("0%");
        keyframes.deleteRule("100%");

        var cloudsSpeed = this.getBackgroundCloudsSpeed();
        var frame0 = 0;
        var frame100 = 0;

        if(cloudsSpeed > 0) {
        	frame100 = cloudsSpeed;
        } else {
        	frame0 = frame100 = this.getRandom(1, 1300);
        }

        keyframes.insertRule("0% { background-position: " + frame0 + "px 0px }");
        keyframes.insertRule("100% { background-position: " + frame100 + "px 0px }");

        var jWeather = $('.weather');
        jWeather.css('webkitAnimationName', 'none');
        setTimeout(function(){
        	jWeather.css('webkitAnimationName', name);
        },1);
    },

    initAllCloudsKeyFrame: function()
    {
    	for(var i = 1; i <= 4; i++){
    		var keyframes = this.findKeyframesRule("cloud" + i);
    		this.deleteKeyFramesRules(keyframes, "from", "to");

    		var jCloud = $("#cloud_" + i);
    		this.insertKeyFramesRules(keyframes, "from { left: " + this.getFromRule(jCloud) + "px }", "to { left: " + this.getToRule() + "px }")

    		jCloud.css('-webkit-animation' , 'cloud' + i + ' ' + this.getSpeedRule(jCloud) + 'ms infinite');
    	}
    },

    resetCloudKeyFrame: function(jCloud)
    {
    	var self = this;
    	var id = jCloud.attr('id');
    	id = id.substring(id.length - 1, id.length);

		var keyframes = self.findKeyframesRule("cloud" + id);
		self.deleteKeyFramesRules(keyframes, "from", "to");
		self.insertKeyFramesRules(keyframes, "from { left: -350px }", "to { left: " + self.getToRule() + "px }");

		jCloud.css('top', self.getRandom(-70, 140) + 'px');
		jCloud.css('webkitAnimationName', 'none');
    	jCloud.css('-webkit-animation' , 'cloud' + id + ' ' + self.getSpeedRule(jCloud) + 'ms infinite');
    },

    getCloudsSpeed: function(){
		if(this.windSpeed < 2){
			return 80000;
		}

		if(this.windSpeed > 29){
			return 15000;
		}

		return 80000 - 65000 / 27 * this.windSpeed;
	},

    getSpeedRule: function(jCloud){
    	var from = this.getFromRule(jCloud);
		var totalTime = this.getCloudsSpeed();
		var pixelPerMillesecond = totalTime / 600;
		var pixelToFinish = 0;

		if(from < 0){
			pixelToFinish = 600 - (240 + from * -1);
		} else {
			pixelToFinish = 600 - 240 - from;
		}

		return totalTime - pixelPerMillesecond * pixelToFinish;
    },

    getToRule: function(){
    	return 500;
    },

    getFromRule: function(jCloud){
    	return jCloud.position().left;
    },

    insertKeyFramesRules: function(keyFrame, rule1, rule2){
    	keyFrame.insertRule(rule1);
    	keyFrame.insertRule(rule2);
    },

    deleteKeyFramesRules: function(keyFrame, rule1, rule2){
    	keyFrame.deleteRule(rule1);
    	keyFrame.deleteRule(rule2);
    },

	findKeyframesRule: function(rule)
    {
        var ss = document.styleSheets;
        for (var i = 0; i < ss.length; ++i) {
            for (var j = 0; j < ss[i].cssRules.length; ++j) {
                if (ss[i].cssRules[j].type == window.CSSRule.WEBKIT_KEYFRAMES_RULE && ss[i].cssRules[j].name == rule)
                    return ss[i].cssRules[j];
            }
        }

        return null;
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
				self.loadJsFile("../js/suncalc.js", function(){
					self.init();
				});
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