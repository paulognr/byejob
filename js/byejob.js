var byejob = {
	loadJsFiles: function(){
		var self = this;
		setTimeout(function(){
			self.loadJsFile("../js/jquery-2.1.1.min.js", function(){
				self.init();
			});
		}, 1000);
	},

	init : function() {

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