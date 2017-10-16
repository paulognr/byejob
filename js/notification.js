var ByeJobNotification = {

	loaded: false,

	NOTIFICATION_ID: "byeJobNotification",
	AFTER_LUNCH_NOTIFICATION_ID: "afterLunchNotification",

    KEY_ENTRY_2: "byejob.entry2",
	KEY_LEAVE: "byejob.leave2",
	KEY_TOLERANCE_START: "byejob.tolerance1",
	KEY_TOLERANCE_END: "byejob.tolerance2",
	KEY_NOTIFIED: "byejob.notified",
	KEY_LAST_FIVE_MINUTES: "byejob.last.five.minutes",
	KEY_NOTIFIED_AFTER_LUNCH: "byejob.notified.after.lunch",

    KEY_HISTORY_SUNDAY: "byejob.average.sunday",
    KEY_HISTORY_MONDAY: "byejob.average.monday",
    KEY_HISTORY_TUESDAY: "byejob.average.tuesday",
    KEY_HISTORY_WEDNESDAY: "byejob.average.wednesday",
    KEY_HISTORY_THURSDAY: "byejob.average.thursday",
    KEY_HISTORY_FRIDAY: "byejob.average.friday",
    KEY_HISTORY_SATURDAY: "byejob.average.saturday",

    keyHistories: [
        "KEY_HISTORY_SUNDAY",
        "KEY_HISTORY_MONDAY",
        "KEY_HISTORY_TUESDAY",
        "KEY_HISTORY_WEDNESDAY",
        "KEY_HISTORY_THURSDAY",
        "KEY_HISTORY_FRIDAY",
        "KEY_HISTORY_SATURDAY"],

	TIME_WORKOUT: -1,
	TIME_WORK: 0,
	TIME_TO_TAKE_NAP: 1,
	TIME_TO_GO: 2,
	TIME_WORKAHOLIC: 3,
	TIME_OVERWORKAHOLIC: 4,

	ICON_TIME_TO_GO: '../img/notification/notification_bye_job.png',
	ICON_WORKAHOLIC: '../img/notification/notification_workaholic.jpg',

	notify: function() {
		var currentTime = this.verify();
		if (currentTime == this.TIME_TO_GO) {
			this.timeToGo();
		} else if (currentTime == this.TIME_WORKAHOLIC) {
			this.timeWorkaholic();
		} else if (currentTime == this.TIME_OVERWORKAHOLIC)	{
			this.notificationByeJob();
		}
	},

    notifyAfterLunch: function() {
        var self = this,
			notifiedAfterLunch = localStorage.getItem(this.KEY_NOTIFIED_AFTER_LUNCH),
            keyEntry = localStorage.getItem(this.KEY_ENTRY_2),
            dayOfWeek = new Date().getDay();

        if (keyEntry == null && (notifiedAfterLunch == null || notifiedAfterLunch == 'false')) {

            var dayHistory = localStorage.getItem(self[self.keyHistories[dayOfWeek]]);
            if (dayHistory){
                var entryHistories = JSON.parse(dayHistory),
                    entry2AverageDate = entryHistories.entry2Average == 0 ? null : new Date(entryHistories.entry2Average);

                if(entry2AverageDate && moment(entry2AverageDate).isBefore(moment())){
                    var options = {
                        type: 'basic',
                        iconUrl: '../img/notification/voltou.jpg',
                        title: 'Bye Job - Voltou ?!',
                        message: 'Não esqueça de bater o ponto ;)',
                        priority: 2,
                        requireInteraction: true,
                        buttons: [{
                            title: "Ok, obrigado",
                            iconUrl: '../img/notification/notification_ok.png'
                        }]
                    };

                    chrome.notifications.clear(self.AFTER_LUNCH_NOTIFICATION_ID);
                    chrome.notifications.create(self.AFTER_LUNCH_NOTIFICATION_ID, options);

                    chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
                        if (notificationId == self.AFTER_LUNCH_NOTIFICATION_ID) {
                            chrome.notifications.clear(self.AFTER_LUNCH_NOTIFICATION_ID);
                            localStorage.setItem(self.KEY_NOTIFIED_AFTER_LUNCH, true);
                        }
                    });
				}
            }
		}
    },

	showNotification: function(iconUrl, message, progress) {
		var that = this, options = {
			type: 'progress',
			iconUrl: iconUrl,
			title: 'Bye Job o/!',
			message: message,
			priority: 2,
			buttons: [{
				title: "Bye Job",
				iconUrl: '../img/notification/notification_ok.png'
			}, {
				title: "Só mais 5 minutos",
				iconUrl: '../img/notification/notification_nok.png'
			}],
			progress: progress
		};

		chrome.notifications.clear(that.NOTIFICATION_ID);
		chrome.notifications.create(that.NOTIFICATION_ID, options);

		if (!that.loaded) {
			that.loaded = true;
			chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
				if (notificationId == that.NOTIFICATION_ID) {
					chrome.notifications.clear(that.NOTIFICATION_ID);
					if (buttonIndex == 0) {
						that.notificationByeJob();
					} else {
						that.setJustFiveMoreMinutes();
					}
				}
			});

			chrome.notifications.onClicked.addListener(function(notificationId) {
				if (notificationId == that.NOTIFICATION_ID) {
					chrome.notifications.clear(that.NOTIFICATION_ID);
				}
			});
		}
	},

	notificationByeJob: function() {
		localStorage.setItem(this.KEY_NOTIFIED, "true");
	},

	setJustFiveMoreMinutes: function() {
		localStorage.setItem(this.KEY_LAST_FIVE_MINUTES, new Date().getTime());
	},

	timeToGo: function() {
		var infoToLeave = this.calculateProgressTime();
		this.showNotification(this.ICON_TIME_TO_GO, this.getMessageToLeave(infoToLeave[0]), infoToLeave[1]);
	},

	timeWorkaholic: function() {
		this.showNotification(this.ICON_WORKAHOLIC, this.getMessageWorkaholic(), 100);
	},

	getMessageWorkaholic: function() {
		var dateToLeave = new Date(parseInt(localStorage.getItem(this.KEY_LEAVE)));
		moment.locale('pt_BR');
		return "Modo workaholic iniciado " + moment({
			hour: dateToLeave.getHours(),
			minute: dateToLeave.getMinutes()
		}).fromNow();
	},

	getMessageToLeave: function(time) {
		if (time === 0) {
			return "É agora ou nunca!";
		}

		if (time === 1) {
			return "Você tem " + time + " minuto para sair!";
		}

		return "Você tem " + time + " minutos para sair!";
	},

	calculateProgressTime: function() {
		var dateToleranceStart = new Date(parseInt(localStorage.getItem(this.KEY_TOLERANCE_START)));
		var timeDifference = this.timeDifferenceBetween(this.getTimeString(dateToleranceStart),
			this.getTimeString(new Date())).split(':')[1];

		return [20 - timeDifference, Math.round(100 / 20 * timeDifference)];
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

	getTimeString: function(date) {
		var time = new Date();
		time.setTime(date);
		var hours = time.getHours();
		var minutes = time.getMinutes();
		return (hours >= 10 ? hours : '0' + hours) + ":" + (minutes >= 10 ? minutes : '0' + minutes);
	},

	verify: function() {
		var keyLeave = localStorage.getItem(this.KEY_LEAVE);
		if (keyLeave) {
			if (localStorage.getItem(this.KEY_NOTIFIED) == "true") {
				return this.TIME_WORKOUT;
			}

			var currentTime = new Date().getTime();
			var dateToleranceStart = new Date(parseInt(localStorage.getItem(this.KEY_TOLERANCE_START)));
			var dateToleranceEnd = new Date(parseInt(localStorage.getItem(this.KEY_TOLERANCE_END)));
			var overWorkaholic = new Date(parseInt(localStorage.getItem(this.KEY_TOLERANCE_END))).setHours(dateToleranceEnd.getHours() + 6);

			var stringLastFiveMinutes = localStorage.getItem(this.KEY_LAST_FIVE_MINUTES);
			if (stringLastFiveMinutes) {
				var dateLastFiveMinutes = new Date(parseInt(stringLastFiveMinutes));
				var m = moment(dateLastFiveMinutes).add(5, 'minutes');
				if (m.isAfter(moment())) {
					return this.TIME_TO_TAKE_NAP;
				}
			}

			if (dateToleranceStart.getTime() > currentTime) {
				return this.TIME_WORK;
			}

			if (overWorkaholic < currentTime) {
				return this.TIME_OVERWORKAHOLIC;
			}

			if (dateToleranceEnd.getTime() < currentTime) {
				return this.TIME_WORKAHOLIC;
			}

			if (dateToleranceStart.getTime() <= currentTime && dateToleranceEnd.getTime() >= currentTime) {
				return this.TIME_TO_GO;
			}

			return this.TIME_WORKOUT;
		} else {
			return this.TIME_WORKOUT;
		}
	}
}

setInterval(function() {
	ByeJobNotification.notify();
	ByeJobNotification.notifyAfterLunch();
}, 100000);
