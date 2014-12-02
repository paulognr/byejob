var byejob = {

	KEY_ENTRY_1: "byejob.entry1",
	KEY_ENTRY_2: "byejob.entry2",
	KEY_LEAVE_1: "byejob.leave1",

	jEntry1: null,
	jEntry2: null,
	jLeave1: null,

	init : function() {
		this.loadJqueryObjects();
		this.loadEvents();
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
	},

	saveKeyLocalSession: function(key, value){
		localStorage.setItem(key, value);
	},

	getKeyLocalSession: function(key){
		localStorage.setItem(key);
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