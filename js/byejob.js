var byejob = {

	KEY_CURRENT_DAY: "byejob.current.day",
	KEY_ENTRY_1: "byejob.entry1",
	KEY_ENTRY_2: "byejob.entry2",
	KEY_LEAVE_1: "byejob.leave1",
	KEY_LEAVE_2: "byejob.leave2",
	KEY_TOLERANCE_1: "byejob.tolerance1",
	KEY_TOLERANCE_2: "byejob.tolerance2",
	KEY_LAST_WEATHER_CONSULT: "byejob.last.weather.consult",
	KEY_LAST_WEATHER_DESCRIPTION: "byejob.last.weather.description",
	KEY_LAST_TEMPERATURE: "byejob.last.temperature",
	KEY_LAST_CLOUDS: "byejob.last.clouds",
	KEY_LAST_WIND_SPEED: "byejob.last.wind.speed",
	KEY_NOTIFIED: "byejob.notified",
	KEY_LAST_FIVE_MINUTES: "byejob.last.five.minutes",
	KEY_VACATION: "byejob.vacation",
	KEY_SAVED_VACATION: "byejob.saved.vacation",
	KEY_EXPEDIENT: "byejob.expedient",

	jEntry1: null,
	jEntry2: null,
	jLeave1: null,
	jLeave2: null,
	jTolerance1: null,
	jTolerance2: null,
	jStartVacation: null,
	jPlane: null,
	jSettings: null,

	expedient: null,
	temperature: null,
	weatherDescription: null,
	clouds: null,
	windSpeed: null,
	filters: {},
	latitude: null,
	longitude: null,
	startVacation: null,
	savedVacation: null,
	refreshPlanePosition: true,

	init: function() {
		moment.locale('pt_BR');
		this.loadExpedient();
		this.loadJqueryObjects();
		this.loadEvents();
		this.loadCurrentDay();
		this.loadPosition();
	},
	
	addFireworks: function(index) {
		var self = this;
		var count = 1;
		for(var i = 0; i < index; i++){
			setTimeout(function(){
				var img = $('<img>');
				img.attr('id', 'fireworks-' + count);
				img.attr('width', '400px').attr('height', '190px').attr('src', '../img/giphy.gif');
				img.css('position', 'fixed');
				img.css('left', self.getRandom(-150, 200)).css('top', self.getRandom(-50, 80));
				$('.block-background').append(img);
				setInterval(function(count1){
					var jFirework = $('#fireworks-' + count1);
					jFirework.fadeOut();
					jFirework.css('left', self.getRandom(-150, 200)).css('top', self.getRandom(-50, 80));
					jFirework.fadeIn();
				}, 4100, count);
				count++;
			}, self.getRandom(0, 5000));
		}
	},

	loadPosition: function() {
		var self = this;
		navigator.geolocation.getCurrentPosition(function(position) {
			self.latitude = position.coords.latitude;
			self.longitude = position.coords.longitude;
			self.loadWeather();
		}, function() {
			self.loadDefaultPosition();
		});
	},
	
	loadDefaultPosition: function() {
		this.latitude = -26.260500;
		this.longitude = -48.863430;
		this.loadWeather();
	},

	loadWeather: function() {
		var self = this;
		if (self.isNeedRefreshWeather() === true) {
			var url = 'http://api.openweathermap.org/data/2.5/weather?lang=en&lat=' + self.latitude + '&lon='
				+ self.longitude + '&APPID=8798ebb0cb4906589ca53da30af6f94e';

			var xhr = new XMLHttpRequest();
			xhr.timeout = 5000;
			xhr.open("GET", url, true);
			
			xhr.ontimeout = function(){
				self.showByeJob(true);
			};
			
			xhr.onerror = function(){
				self.showByeJob(true);
			};
			
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					var data = JSON.parse(xhr.response);
					var temperature = Math.round(data.main.temp - 273.15);
					var description = data.weather[0].description;
					var clouds = data.clouds.all;
					var windSpeed = data.wind.speed;

					self.saveKeyLocalSession(self.KEY_LAST_TEMPERATURE, temperature);
					self.saveKeyLocalSession(self.KEY_LAST_WEATHER_DESCRIPTION, description);
					self.saveKeyLocalSession(self.KEY_LAST_CLOUDS, clouds);
					self.saveKeyLocalSession(self.KEY_LAST_WIND_SPEED, windSpeed);

					self.saveKeyLocalSession(self.KEY_LAST_WEATHER_CONSULT, new Date().getTime());
					
					self.showByeJob();
				}
			}
			xhr.send();
		} else {
			self.showByeJob();
		}
	},
	
	showByeJob: function(defaultWeather) {
		var self = this;
		
		if(defaultWeather){
			self.loadDefaultWeather();
		} else {
			self.loadCacheWeather();
		}
		
		self.loadWeatherAnimation();
		self.loadVacation();
		
		$('#first_page').fadeOut(function() {
			$('#content').fadeIn(function() {
				self.loadClouds();
				self.loadSettings();
			});
		});
	},
	
	loadSettings: function() {
		var self = this;
		self.jSettings.animate({marginLeft: '-6px'}, 200);
		if(!self.expedient){
			self.jSettings.click();
		}
	},
	
	loadDefaultWeather: function() {
		this.temperature = 10;
		this.weatherDescription = "clear sky"
		this.clouds = 10;
		this.windSpeed = 1;
	},
	
	loadCacheWeather: function() {
		var self = this;
		self.temperature = self.getKeyLocalSession(self.KEY_LAST_TEMPERATURE);
		self.weatherDescription = self.getKeyLocalSession(self.KEY_LAST_WEATHER_DESCRIPTION);
		self.clouds = self.getKeyLocalSession(self.KEY_LAST_CLOUDS);
		self.windSpeed = self.getKeyLocalSession(self.KEY_LAST_WIND_SPEED);
	},
	
	loadVacation: function(){
		var self = this, 
			startVacationTime = self.getKeyLocalSession(self.KEY_VACATION),
			savedVacationTime = self.getKeyLocalSession(self.KEY_SAVED_VACATION);
		if(startVacationTime && savedVacationTime){
			self.savedVacation = new Date(parseInt(savedVacationTime));
			self.startVacation = new Date(parseInt(startVacationTime));
			
			var startVacationString = self.startVacation.getFullYear() + "-" + 
				self.getMonthToString(self.startVacation) + "-" +
				self.getDayToString(self.startVacation);
				
			if(startVacationString !== self.jStartVacation.val()){
				self.jStartVacation.val(startVacationString);
			}
		}
		
		self.loadPlanePosition();
	},
	
	loadPlanePosition: function(){
		var self = this;
		
		if(!self.refreshPlanePosition){
			return;
		}
		
		self.refreshPlanePosition = false;
		
		if(self.startVacation){
			var diffVacation = moment(self.startVacation).diff(moment(self.savedVacation), 'days');
			if(diffVacation > 0){
				var diffCurrent = moment().diff(moment(self.savedVacation), 'days');			
				var diffFinal = 100 / diffVacation * diffCurrent;
				var currentPosition = 360 /100 * diffFinal;
				
				self.jPlane.css('left', '-73px').css('bottom', '6px');
				self.jPlane.animate({left: currentPosition + 'px'}, 8000);

				$('.vacation-info').html("Previsão de chegada " + moment().to(self.startVacation));
			} else {
				self.vacationMode();
			}
		} else{
			$('.vacation-info').html("Sem permissão para pousar!");
			self.jStartVacation.val("");
			self.flyForever();
		}
	},
	
	vacationMode: function(){
		var self = this;
		$('.block-background').fadeIn(300, 
			function(){
				self.addFireworks(2);
			}
		);
	},
	
	flyForever: function() {
		var self = this;

		self.jPlane.css('left', '-73px').css('bottom', self.getRandom(3, 153) + 'px');
		self.jPlane.animate(
			{left: '500px'}, 20000, 
			function(){
				if(!self.startVacation){
					self.flyForever();
				}
			}
		);
	},
	
	saveVacation: function(event){
		var self = this;
		var vacationDate = self.getDate(self.jStartVacation.val());
		if(vacationDate){
			var dateSavedVacation = new Date();
			dateSavedVacation.setHours(0, 0, 0);
			self.savedVacation = dateSavedVacation;
			self.saveKeyLocalSession(self.KEY_SAVED_VACATION, dateSavedVacation.getTime());
			
			self.saveKeyLocalSession(self.KEY_VACATION, vacationDate.getTime());
			self.startVacation = vacationDate;
		} else {
			self.saveKeyLocalSession(self.KEY_SAVED_VACATION, null);
			self.saveKeyLocalSession(self.KEY_VACATION, null);
			self.startVacation = null;
		}
		
		self.refreshPlanePosition = true;
	},

	isNeedRefreshWeather: function() {
		var lastConsult = parseInt(this.getKeyLocalSession(this.KEY_LAST_WEATHER_CONSULT));
		if (lastConsult > 0) {
			var lastDate = new Date(lastConsult);
			var hours = parseInt(this.timeDifferenceBetween(this.getTimeString(lastDate),
				this.getTimeString(new Date())).split(":")[0]);
			return lastDate.getDate() != new Date().getDate() || hours > 0;
		}

		return true;
	},

	loadWeatherAnimation: function() {
		var self = this;
		self.loadBackgroundAnimation();
		self.loadBackgroundCloudsSpeed();
		self.loadSunlight();
		self.loadRain();
	},

	loadBackgroundAnimation: function() {
		var backgroundClass;
		var grayscale = 100;
		var shadow = '#000';

		switch (this.weatherDescription.toLowerCase()) {
			case "shower rain":
			case "thunderstorm":
				backgroundClass = "dark-cloud-day";
				grayscale = 100;
				shadow = '#000'
				break;

			case "broken clouds":
			case "scattered clouds":
			case "overcast clouds":
			case "moderate rain":
				backgroundClass = "grey-cloud-day";
				grayscale = 75;
				shadow = '#363636'
				break;

			case "mist":
			case "rain":
				backgroundClass = "foggy-day";
				grayscale = 50;
				shadow = '#E8E8E8'
				break;

			case "heavy intensity rain":
			case "light rain":
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

	loadFilters: function() {
		var webkitFilter = 'grayscale(' + this.filters['grayscale'] + '%) drop-shadow(0px 4px 8px '
			+ this.filters['shadow'] + ')';
		$('.plates').css('-webkit-filter', webkitFilter);
		$('.board').css('-webkit-filter', webkitFilter);
		$('.rope').css('-webkit-filter', webkitFilter);
	},

	loadSunlight: function() {
		var self = this;
		var sunPosition;
		switch (self.weatherDescription.toLowerCase()) {
			case "heavy intensity rain":
			case "moderate rain":
			case "broken clouds":
			case "sky is clear":
			case "few clouds":
			case "clear sky":
			case "rain":
				sunPosition = SunCalc.getPosition(new Date(), self.latitude, self.longitude);
				var altitude = sunPosition.altitude * 100;
				var radius = sunPosition.azimuth * 180 / Math.PI;

				if (radius < 0) {
					radius = radius < 0 ? radius * -1 - 60 : radius;
				} else {
					radius = radius > 0 ? 180 - radius + 180 : radius;
				}

				var jWeather = $('.weather');
				var opacity = 1;

				if (jWeather.hasClass('white-cloud-day')) {
					opacity = 0.8;
				} else if (jWeather.hasClass('grey-cloud-day') || jWeather.hasClass('foggy-day')) {
					opacity = 0.6;
				}

				$('#sun').css('top', 160 - (148 / 370 * 6 * altitude)).css('left', 420 - (640 / 300 * radius)).css(
					'opacity', opacity);
				break;
		}
	},

	loadBackgroundCloudsSpeed: function() {
		this.changeFullbgKeyFrame();
	},

	loadRain: function() {
		var self = this;

		switch (self.weatherDescription.toLowerCase()) {
			case "heavy intensity rain":
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

	loadClouds: function() {
		var jWeather = $('.weather'), jCloud1 = $('#cloud_1'), jCloud2 = $('#cloud_2'), jCloud3 = $('#cloud_3'), jCloud4 = $('#cloud_4'), cloudPath = "url(../img/weather/cloud", loadClouds = false;

		if (jWeather.hasClass('white-cloud-day')) {
			cloudPath += "/white/white_cloud_day_";
			loadClouds = true;
		} else if (jWeather.hasClass('grey-cloud-day') || jWeather.hasClass('foggy-day')) {
			cloudPath += "/grey/grey_cloud_day_";
			loadClouds = true;
		} else if (jWeather.hasClass('dark-cloud-day')) {
			cloudPath += "/dark/dark_cloud_day_";
			loadClouds = true;
		}

		if (loadClouds === true) {
			if (this.clouds >= 20 && this.clouds < 40) {
				this.addCloud(jCloud1, cloudPath, 1);
			} else if (this.clouds >= 40 && this.clouds < 60) {
				this.addCloud(jCloud1, cloudPath, 1);
				this.addCloud(jCloud2, cloudPath, 2);
			} else if (this.clouds >= 60 && this.clouds < 80) {
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

	addCloud: function(jCloud, cloudPath, index) {
		var self = this;
		jCloud.css('background-image', cloudPath + index + '.png)');
		jCloud.css('top', self.getRandom(-70, 140) + 'px');
		jCloud.css('left', self.getRandom(-250, 350) + 'px');
		jCloud.fadeIn(function() {
			self.initAllCloudsKeyFrame();
		});

		setInterval(function() {
			if (jCloud.position().left > 440) {
				self.resetCloudKeyFrame(jCloud);
			}
		}, 1000);
	},

	loadExpedient: function() {
		var self = this;
		
		$('#expedient-time').timeEntry({
			show24Hours : true,
			spinnerImage: ''
		});
		
		var expedientValue = self.getKeyLocalSession(self.KEY_EXPEDIENT);
		if (expedientValue) {
			var expedientDate = new Date(parseInt(expedientValue));
			self.expedient = new Date();
			self.expedient.setHours(expedientDate.getHours(), expedientDate.getMinutes(), 0, 0);
			$('#expedient-time').val(self.getTimeString(expedientDate));
		}
	},

	loadCurrentDay: function() {
		var self = this;
		var currentDay = self.getKeyLocalSession(self.KEY_CURRENT_DAY);
		
		$('input[data-time]').timeEntry({
			show24Hours : true,
			spinnerImage: ''
		});

		if (currentDay) {
			if (currentDay == new Date().getDate()) {
				self.loadTimes();
			} else {
				self.reseteTimes();
			}
		} else {
			self.saveCurrentDay();
		}
	},

	loadTimes: function(resetNotifications) {
		var entry1 = this.getKeyLocalSession(this.KEY_ENTRY_1);
		if (entry1) {
			this.jEntry1.val(this.getTimeString(entry1));
		}

		var entry2 = this.getKeyLocalSession(this.KEY_ENTRY_2);
		if (entry2) {
			this.jEntry2.val(this.getTimeString(entry2));
		}

		var leave1 = this.getKeyLocalSession(this.KEY_LEAVE_1);
		if (leave1) {
			this.jLeave1.val(this.getTimeString(leave1));
		}

		this.calculateLeave(resetNotifications);
	},

	getTimeString: function(date) {
		var time = new Date();
		time.setTime(date);
		var hours = time.getHours();
		var minutes = time.getMinutes();
		return (hours >= 10 ? hours : '0' + hours) + ":" + (minutes >= 10 ? minutes : '0' + minutes);
	},

	reseteTimes: function() {
		localStorage.removeItem(this.KEY_ENTRY_1);
		this.jEntry1.val("");

		localStorage.removeItem(this.KEY_ENTRY_2);
		this.jEntry2.val("");

		localStorage.removeItem(this.KEY_LEAVE_1);
		this.jLeave1.val("");

		localStorage.removeItem(this.KEY_LEAVE_2);
		localStorage.removeItem(this.KEY_TOLERANCE_1);
		localStorage.removeItem(this.KEY_TOLERANCE_2);
		localStorage.removeItem(this.KEY_NOTIFIED);
		localStorage.removeItem(this.KEY_LAST_FIVE_MINUTES);

		this.saveCurrentDay();
	},

	calculateLeave: function(resetNotifications) {
		var self = this;

		var entry1 = new Date(parseInt(self.getKeyLocalSession(self.KEY_ENTRY_1)));
		var leave1 = new Date(parseInt(self.getKeyLocalSession(self.KEY_LEAVE_1)));
		var entry2 = new Date(parseInt(self.getKeyLocalSession(self.KEY_ENTRY_2)));

		var leave = "";
		var tolerance1 = "";
		var tolerance2 = "";

		if (!isNaN(entry1) && !isNaN(leave1) && !isNaN(entry2)) {
			var firstRound = self.timeDifferenceBetween(self.getTimeString(entry1), self.getTimeString(leave1));
			var secondRound = self.timeDifferenceBetween(firstRound, self.getTimeString(self.expedient));
			leave = self.sumHours(self.getTimeString(entry2), secondRound);
			tolerance1 = self.timeDifferenceBetween("00:10", leave);
			tolerance2 = self.sumHours(leave, "00:10");
		}

		var leave1 = self.getKeyLocalSession(self.KEY_LEAVE_1);
		if (leave1) {
			self.jLeave1.val(self.getTimeString(leave1));
		}

		if (resetNotifications) {
			self.saveKeyLocalSession(self.KEY_NOTIFIED, "false");
			self.saveKeyLocalSession(self.KEY_LAST_FIVE_MINUTES, null);
		}

		self.saveLeaveAndTolerance(leave, tolerance1, tolerance2);
	},

	saveLeaveAndTolerance: function(leave, tolerance1, tolerance2) {
		var self = this;

		self.jLeave2.html(leave);
		var dateLeave = new Date();
		dateLeave.setHours(leave.split(':')[0], leave.split(':')[1], 0, 0);
		self.saveKeyLocalSession(self.KEY_LEAVE_2, dateLeave.getTime());

		self.jTolerance1.html(tolerance1);
		var dateToleranceStart = new Date();
		dateToleranceStart.setHours(tolerance1.split(':')[0], tolerance1.split(':')[1], 0, 0);
		self.saveKeyLocalSession(self.KEY_TOLERANCE_1, dateToleranceStart.getTime());

		self.jTolerance2.html(tolerance2);
		var dateToleranceEnd = new Date();
		dateToleranceEnd.setHours(tolerance2.split(':')[0], tolerance2.split(':')[1], 59, 59);
		self.saveKeyLocalSession(self.KEY_TOLERANCE_2, dateToleranceEnd.getTime());
	},

	sumHours: function(start, end) {
		var hourStart = start.split(':');
		var hourEnd = end.split(':');

		var hourTotal = parseInt(hourStart[0], 10) + parseInt(hourEnd[0], 10);
		var minutesTotal = parseInt(hourStart[1], 10) + parseInt(hourEnd[1], 10);

		if (minutesTotal >= 60) {
			minutesTotal -= 60;
			hourTotal += 1;
		}

		return (hourTotal >= 10 ? hourTotal : '0' + hourTotal) + ":"
			+ (minutesTotal >= 10 ? minutesTotal : '0' + minutesTotal);
	},
	
	getDayToString: function(date){
		var day = date.getDate();
		return day > 9 ? day : ("0" + day);
	},
	
	getMonthToString: function(date){
		var month = date.getMonth() + 1;
		return month > 9 ? month : ("0" + month);
	},

	timeDifferenceBetween: function(start, end) {
		var hIni = start.split(':');
		var hFim = end.split(':');

		var hTotal = parseInt(hFim[0], 10) - parseInt(hIni[0], 10);
		var mTotal = parseInt(hFim[1], 10) - parseInt(hIni[1], 10);

		if (mTotal < 0) {
			mTotal += 60;
			hTotal -= 1;
		}

		return (hTotal >= 10 ? hTotal : '0' + hTotal) + ":" + (mTotal >= 10 ? mTotal : '0' + mTotal);
	},

	saveCurrentDay: function() {
		this.saveKeyLocalSession(this.KEY_CURRENT_DAY, new Date().getDate());
	},

	saveTime: function(event) {
		var self = this;
		var jEntry = $(event.target);
		var time = jEntry.val().trim();

		var value = null;
		if (time.length > 0) {
			value = self.getTime(time).getTime();
		}

		var data = jEntry.data('entry');
		if (data) {
			if (data == 1) {
				self.saveKeyLocalSession(self.KEY_ENTRY_1, value);
			} else if (data == 2) {
				self.saveKeyLocalSession(self.KEY_ENTRY_2, value);
			}
		} else {
			var data = jEntry.data('leave');
			if (data && data == 1) {
				self.saveKeyLocalSession(self.KEY_LEAVE_1, value);
			}
		}

		self.calculateLeave(true);
	},

	saveKeyLocalSession: function(key, value) {
		if (value) {
			localStorage.setItem(key, value);
		} else {
			localStorage.removeItem(key);
		}
	},

	getKeyLocalSession: function(key) {
		return localStorage.getItem(key);
	},

	getTime: function(time) {
		var timeArray = time.split(":");
		var date = new Date();
		date.setHours(timeArray[0]);
		date.setMinutes(timeArray[1]);
		date.setSeconds(0);
		date.setMilliseconds(0);
		return date;
	},
	
	getDate: function(time) {
		if(!time){
			return null;
		}
		
		var timeArray = time.split("-");
		var date = new Date();
		date.setFullYear(timeArray[0], timeArray[1] - 1, timeArray[2]);
		date.setHours(0, 0, 0);
		return date;
	},

	getRandom: function(min, max) {
		if (min < 0) {
			return min + Math.random() * (Math.abs(min)+max);
		}else {
			return min + Math.random() * max;
		}
	},

	getBackgroundCloudsSpeed: function() {
		if (this.windSpeed < 2) {
			return 0;
		}

		if (this.windSpeed > 29) {
			return 6000;
		}

		return 6000 / 60 * this.windSpeed + 1000;
	},

	changeFullbgKeyFrame: function() {
		var keyframes = this.findKeyframesRule("fullbg");

		keyframes.deleteRule("0%");
		keyframes.deleteRule("100%");

		var cloudsSpeed = this.getBackgroundCloudsSpeed();
		var frame0 = 0;
		var frame100 = 0;

		if (cloudsSpeed > 0) {
			frame100 = cloudsSpeed;
		} else {
			frame0 = frame100 = this.getRandom(1, 1300);
		}

		keyframes.appendRule("0% { background-position: " + frame0 + "px 0px }");
		keyframes.appendRule("100% { background-position: " + frame100 + "px 0px }");

		var jWeather = $('.weather');
		jWeather.css('webkitAnimationName', 'none');
		setTimeout(function() {
			jWeather.css('webkitAnimationName', name);
		}, 1);
	},

	initAllCloudsKeyFrame: function() {
		for (var i = 1; i <= 4; i++) {
			var keyframes = this.findKeyframesRule("cloud" + i);
			this.deleteKeyFramesRules(keyframes, "from", "to");

			var jCloud = $("#cloud_" + i);
			this.insertKeyFramesRules(keyframes, "from { left: " + this.getFromRule(jCloud) + "px }", "to { left: "
				+ this.getToRule() + "px }")

			jCloud.css('-webkit-animation', 'cloud' + i + ' ' + this.getSpeedRule(jCloud) + 'ms infinite');
		}
	},

	resetCloudKeyFrame: function(jCloud) {
		var self = this;
		var id = jCloud.attr('id');
		id = id.substring(id.length - 1, id.length);

		var keyframes = self.findKeyframesRule("cloud" + id);
		self.deleteKeyFramesRules(keyframes, "from", "to");
		self.insertKeyFramesRules(keyframes, "from { left: -350px }", "to { left: " + self.getToRule() + "px }");

		jCloud.css('top', self.getRandom(-70, 140) + 'px');
		jCloud.css('webkitAnimationName', 'none');
		jCloud.css('-webkit-animation', 'cloud' + id + ' ' + self.getSpeedRule(jCloud) + 'ms infinite');
	},

	getCloudsSpeed: function() {
		if (this.windSpeed < 2) {
			return 80000;
		}

		if (this.windSpeed > 29) {
			return 15000;
		}

		return 80000 - 65000 / 27 * this.windSpeed;
	},

	getSpeedRule: function(jCloud) {
		var from = this.getFromRule(jCloud);
		var totalTime = this.getCloudsSpeed();
		var pixelPerMillesecond = totalTime / 600;
		var pixelToFinish = 0;

		if (from < 0) {
			pixelToFinish = 600 - (240 + from * -1);
		} else {
			pixelToFinish = 600 - 240 - from;
		}

		return totalTime - pixelPerMillesecond * pixelToFinish;
	},

	getToRule: function() {
		return 500;
	},

	getFromRule: function(jCloud) {
		return jCloud.position().left;
	},

	insertKeyFramesRules: function(keyFrame, rule1, rule2) {
		keyFrame.appendRule(rule1);
		keyFrame.appendRule(rule2);
	},

	deleteKeyFramesRules: function(keyFrame, rule1, rule2) {
		keyFrame.deleteRule(rule1);
		keyFrame.deleteRule(rule2);
	},

	findKeyframesRule: function(rule) {
		var ss = document.styleSheets;
		for (var i = 0; i < ss.length; ++i) {
			for (var j = 0; j < ss[i].cssRules.length; ++j) {
				if (ss[i].cssRules[j].type == window.CSSRule.WEBKIT_KEYFRAMES_RULE && ss[i].cssRules[j].name == rule) {
					return ss[i].cssRules[j];
				}
			}
		}

		return null;
	},
	
	settings: function() {
		var self = this;
		var jSettingsBox = $('.settings-box');
		if (jSettingsBox.hasClass('open')) {
			var jExpedientTime = $('#expedient-time'), expedient = jExpedientTime.val();
			if (expedient) {
				self.expedient = self.getTime(expedient);
				self.saveKeyLocalSession(self.KEY_EXPEDIENT, self.expedient.getTime());
				self.loadTimes(true);
				jSettingsBox.removeClass('open');
			} else {
				jExpedientTime.css('border-color','red');
				jExpedientTime.on('change', function(){
					$(this).removeAttr('style');
				});
			}
		} else {
			jSettingsBox.addClass('open');
		}
	},

	loadJqueryObjects: function() {
		this.jEntry1 = $('#entry_1');
		this.jEntry2 = $('#entry_2');
		this.jLeave1 = $('#leave_1');
		this.jLeave2 = $('#leave_2');
		this.jTolerance1 = $('#tolerance_1');
		this.jTolerance2 = $('#tolerance_2');
		this.jStartVacation = $('#start-vacation');
		this.jPlane = $('.plane');
		this.jSettings = $('#settings');
	},

	loadEvents: function() {
		var self = this;
		$(document).on('click', function(event){
			jTarget = $(event.target);
			if($('.settings-box.open').length > 0 
				&& jTarget.attr('id') != 'settings' 
				&& jTarget.attr('id') != 'expedient-time'){
				self.jSettings.click();
			}
		});
		
		$(document).on('keydown', function(event){
			self.handleDocumentKeyDown(event);
		});
		
		self.jEntry1.on('blur', function(event) {
			self.saveTime(event);
		});

		self.jEntry2.on('blur', function(event) {
			self.saveTime(event);
		});

		self.jLeave1.on('blur', function(event) {
			self.saveTime(event);
		});
		
		self.jStartVacation.on('change', function(event){
			self.saveVacation(event);
		});
		
		$('.vacation-island').on('mouseenter', function(){
			var jIsland = this;
			$(jIsland).removeClass('mouse-out').addClass('mouse-over');
			
			var $blokBackground = $('.block-background');
			if($blokBackground.hasClass('mouse-out')){
				$blokBackground.fadeIn(300, function(){
					$blokBackground.removeClass('mouse-out').addClass('mouse-over');
					$(jIsland).removeClass('mouse-out').addClass('mouse-over');
				});
			}
		});
		
		$('.vacation-island').on('mouseleave', function(){
			var jIsland = this;
			$(jIsland).removeClass('mouse-over').addClass('mouse-out');
			
			var $blokBackground = $('.block-background');
			if($blokBackground.hasClass('mouse-over')){
				$blokBackground.fadeOut(300, function(){
					$blokBackground.removeClass('mouse-over').addClass('mouse-out');
					$(jIsland).removeClass('mouse-over').addClass('mouse-out');
					self.loadVacation();
				});
			}
		});
		
		self.jSettings.on('click', function(){
			self.settings();
		});
	},
	
	handleDocumentKeyDown: function(event){
		if(event.which === 13){
			if(event.shiftKey){
				$.tabPrev();
			}
			else{
				$.tabNext();
			}
			event.preventDefault();	
		}
	},

	loadJsFiles: function() {
		var self = this;
		setTimeout(function() {
			self.loadJsFile("../js/jquery-2.1.1.min.js", function() {
				self.loadJsFile("../js/suncalc.js", function() {
					self.loadJsFile("../js/moment-with-locales.min.js", function() {
						self.loadJsFile("../js/jquery.plugin.min.js", function() {
							self.loadJsFile("../js/jquery.timeentry.min.js", function() {
								self.loadJsFile("../js/jquery.tabbable.min.js", function() {
									self.init();
								});
							});
						});
					});
				});
			});
		}, 1000);
	},

	loadJsFile: function(filename, callback) {
		var fileref = document.createElement('script');
		fileref.setAttribute("type", "text/javascript");
		fileref.setAttribute("src", filename);
		fileref.onload = callback;
		document.getElementsByTagName("head")[0].appendChild(fileref);
	}
};

document.addEventListener('DOMContentLoaded', function() {
	byejob.loadJsFiles();
});