var NodeHelper = require("node_helper");
var fs = require("fs");
var exec = require("child_process").exec;
const path = require("path");
module.exports = NodeHelper.create({

	config: null,

	timeractve : null,
	sleeping: false,
	hdmi:  false,

	init: function(){
		console.log("handler helper in init");
	},

	start: function(){
		console.log("handler helper in start");
		//self=this;
	},

	stop: function(){
		console.log("handler helper in stop");
	},

	noUser: function(self)
	{
		//if(self.sleeping==false)
		//{
			self.socketNotificationReceived("start_sleep");
			//}
	}		,
	socketNotificationReceived: function(notification, payload)
	{
		let self = this;
		console.log("sleep-wake helper in socket notification="+notification);
		switch(notification.toUpperCase())
		{
		case "CONFIG":
			self.config=payload;
			self.timeractive=setTimeout(self.noUser,self.config.delay*(60*1000));
			if(self.config.source.toUpperCase() === "EXTERNAL"){
				exec("/bin/chmod +x "+path.join(__dirname,"external_motion"), function (error, stdout, stderr) {
					if(error!=null)
					{
						console.log("change permissions failed "+JSON.stringify(error));
					}
				});

				if(self.config.detectionDir=="/motion")
				{
				  // its the default folder
					//console.log("full path="+path.join(__dirname,self.config.detectionDir))
					self.config.detectionDir= path.join(__dirname,self.config.detectionDir);
					//console.log("setting detectionDir path from local folder ="+self.config.detectionDir);
				}
				if(self.config.debug)
				 console.log(" external source defined dir="+self.config.detectionDir);

				// check to see if the external motion event folder exists
				fs.access(self.config.detectionDir, function(err) {
					// if not
					if (err && err.code === "ENOENT") {
						// create it
						fs.mkdir(self.config.detectionDir, (err)=> {
							if(self.config.debug)
								console.log("created motion directory", self.config.detectionDir);
							exec("/bin/chmod 777 "+self.config.detectionDir, function (error, stdout, stderr) {
								if(error!=null)
								{
									if(self.config.debug)
										console.log("change permissions failed "+JSON.stringify(error));
								}
							});
						})
					}
					else{
						// make sure the directory is empty
						self.rmDir(self.config.detectionDir,false);
					}
					// change detector function
					// watch for a file to appear in the folder
					fs.watch(self.config.detectionDir, (eventType, filename) => {
						if (filename) {
							// remove the file
							fs.unlink(path.join(self.config.detectionDir,filename), function(error) {
								// consume the enonet error
								if(error == null){
									if(self.config.debug)
										console.log("motion detected from external source");
									// if the start motion file
									if(filename === self.config.detectionFile) {
										// signal motion started
										if(self.config.debug)
											console.log("!s:","motionstart");
										clearTimeout(self.timeractive);
										//self.sleeping=false;
										self.timeractive=null;
										//if(self.sleeping){
											self.socketNotificationReceived("end_sleep");
										//}
									}
									else {
										// signal motion ended
										if(self.config.debug)
											console.log("!e:","motionend");
										self.timeractive=setTimeout(()=>{self.noUser(self)},self.config.delay*(60*1000));
										if(self.config.debug)
											console.log("idle timer started for "+self.config.delay+" minutes")
									}
								}
							});
						} else {
							if(self.config.debug)
								console.log("filename not provided");
						}
					});
				});
			}
			break;

		case  "USER_PRESENCE":
			if(payload==true)
			{self.sleeping==false;}
			break;

		case "START_SLEEP":
			if(self.config.debug)
		  	console.log("processing start sleep")
		  // if we are not already sleeping
		  if(!self.sleeping){
				self.sleeping=true;
				switch(self.config.mode.toUpperCase())
				{
				case "PI":
					if(self.config.debug)
				  	console.log("using PI approach (tvservice)='"+self.config.pi_off+"'")
					exec(self.config.pi_off,  function (error, stdout, stderr) {
						if(error!=null)
						{
							console.log(self.config.pi_off +" failed "+JSON.stringify(error));
						}
					});
					self.hdmi = false;
					break;
				case "HIDE":
					if(self.config.debug)
				 		console.log("using HIDE approach")
					// tell the module so it can hide the others
					self.sendSocketNotification("SLEEP_HIDE");
					break;
				case "DPMS":
					if(self.config.debug)
				 		console.log("using DPMS approach (xset)='"+self.config.dmps_off+"'")
					/////////// Turns off laptop display and desktop PC with DVI  @ Mykle ///////////////
					exec(self.config.dpms_off,  function (error, stdout, stderr) {
						if(error!=null)
						{
							console.log(self.config.dpms_off+" failed "+JSON.stringify(error));
						}
					});
					break;
				}
			}
			else{
				if(self.config.debug)
					console.log("start sleep, already sleeping")
			}
			break;

		case "END_SLEEP":
			if(self.config.debug)
		 		console.log("waking up")
		  // if sleeping
		  if(self.sleeping){
		  	// wake up
				self.sleeping=false;
				switch(self.config.mode.toUpperCase())
				{
				case "PI":
					if(self.config.debug)
				  	console.log("waking up using PI approach='"+self.config.pi_on+"'")
					exec(self.config.pi_on,  function (error, stdout, stderr) {
						if(error!=null)
						{
							console.log(self.config.pi_on+" failed "+JSON.stringify(error));
						}
					});
					self.hdmi = true;
					break;
				case "HIDE":
					if(self.config.debug)
				  	console.log("waking up using hHIDE approach")
					// tell the module so it can unhide the others
					self.sendSocketNotification("SLEEP_WAKE");
					break;
				case "DPMS":
					/////////// Turns on laptop display and desktop PC with DVI @ Mykle ///////////////
					if(self.config.debug)
						console.log("waking up using DPMS approach='"+self.config.dpms_on+"'")
					exec(self.config.dpms_on, function (error, stdout, stderr) {
						if(error!=null)
						{
							console.log(self.config.dpms_on +" failed "+JSON.stringify(error));
						}
					});
					break;
				}
			}
			else	{
				if(self.config.debug)
					console.log("waking up, already awake")
			}
			break;

		case "STAND_BY":
			if(payload.status === false) {
				self.sleeping=false;
				self.timeractive=setTimeout(self.noUser,self.config.delay*(60*1000));
			} else if (payload.status === true) {
				self.sleeping=true;
				if(self.timeractive)
				{clearTimeout(self.timeractive);}
			}
			break;

		default:
			break;
		}
	},
	// empty the specified folder. remove if requested
	rmDir : function(dirPath, removeself) {
		if (removeself === undefined)
		{removeself = true;}
		try { var files = fs.readdirSync(dirPath); }
		catch(e) { return; }
		if (files.length > 0)
		{for (var i = 0; i < files.length; i++) {
			var filePath = dirPath + "/" + files[i];
			if (fs.statSync(filePath).isFile())
			{fs.unlinkSync(filePath);}
			else
			{rmDir(filePath);}
		}}
		if (removeself)
		{fs.rmdirSync(dirPath);}
	},
}
);
