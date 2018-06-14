var NodeHelper = require("node_helper");
var fs = require('fs');
const path = require('path');
var vself=null;
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
									vself=this
							},
				
							stop: function(){
									console.log("handler helper in stop");
							},

							noUser: function()
							{	
								if(vself.sleeping==false)
									vself.socketNotificationReceived('start_sleep');									
							},
							
							socketNotificationReceived: function(notification, payload)
							{
								console.log("sleep-wake helper in socket notification="+notification);
								switch(notification.toUpperCase())
								{
									case 'CONFIG':
										vself.config=payload;
										vself.timeractive=setTimeout(vself.noUser,vself.config.delay*(60*1000));
										if(vself.config.source.toUpperCase() === 'EXTERNAL'){
											// check to see if the external motion event folder exists
											fs.access(vself.config.detectionDir, function(err) {
												// if not
												if (err && err.code === 'ENOENT') {
													// create it
													fs.mkdir(vself.config.detectionDir);
													console.log('created motion directory', vself.config.detectionDir);
												}
												else{
													// make sure the directory is empty
													vself.rmDir(vself.config.detectionDir,false);
												}
												// change detector function
												// watch for a file to appear in the folder
												fs.watch(vself.config.detectionDir, (eventType, filename) => {
													if (filename) {
														// remove the file
														//console.log(" f="+vself.config.detectionFile+" file="+filename+"\n")
														//console.log("config="+JSON.stringify(vself.config));
														fs.unlink(path.join(vself.config.detectionDir,filename), function(error) { 
															// consume the enonet error
															if(error == null){
																console.log('motion detected from external source');
																// if the start motion file
																if(filename === vself.config.detectionFile) {
																	// signal motion started
																	console.log("!s:","motionstart");
																	clearTimeout(vself.timeractive)
																	vself.timeractive=null;
																	if(vself.sleeping)
																		vself.socketNotificationReceived('end_sleep');
																}
																else {
																	// signal motion ended 
																	console.log("!e:","motionend");
																	vself.timeractive=setTimeout(vself.noUser,vself.config.delay*(60*1000));
																}
															}
														});
													} else {		
														console.log('filename not provided');
													}
												});
											});
										}
										break;
									case  'USER_PRESENCE':
										if(payload==true)
											vself.sleeping==false;
										break;
									case 'START_SLEEP':
										vself.sleeping=true;
										switch(vself.config.mode.toUpperCase()){
											case 'PI':
												exec('/opt/vc/bin/tvservice -o', null);
												vself.hdmi = false;
												break;
											case 'HIDE':
												// tell the module so it can hide the others
												vself.sendSocketNotification('SLEEP_HIDE');
												break;
											case 'DPMS':
												/////////// Turns off laptop display and desktop PC with DVI  @ Mykle ///////////////
												exec('xset dpms force off', null);
												break;
										}
										if(vself.config.mode.toUpperCase()!=='HIDE')
											vself.sendSocketNotification('HW_ASLEEP')
										break;
									case 'END_SLEEP':
										vself.sleeping=false;
										switch(vself.config.mode.toUpperCase())
										{
											case 'PI':
												exec('/opt/vc/bin/tvservice -p && sudo chvt 6 && sudo chvt 7', null);
												vself.hdmi = true;
												break;
											case 'HIDE':
												// tell the module so it can unhide the others
												vself.sendSocketNotification('SLEEP_WAKE');
												break;
											case 'DPMS':
												/////////// Turns on laptop display and desktop PC with DVI @ Mykle ///////////////
												exec('xset dpms force on', null);
												break;
										}
										if(vself.config.mode.toUpperCase()!=='HIDE')
											vself.sendSocketNotification('HW_AWAKE')
										break;
									case 'NOW_AWAKE':
										vself.sleeping=false;
										vself.timeractive=setTimeout(vself.noUser,vself.config.delay*(60*1000));
									break;
									case 'NOW_ASLEEP':
										vself.sleeping=true;
										if(vself.timeractive)
											clearTimeout(vself.timeractive)
									break;
									default:
										break;
								}
							},
		rmDir : function(dirPath, removevself) {
		if (removevself === undefined)
			removevself = true;
		try { var files = fs.readdirSync(dirPath); }
		catch(e) { return; }
		if (files.length > 0)
			for (var i = 0; i < files.length; i++) {
				var filePath = dirPath + '/' + files[i];
				if (fs.statSync(filePath).isFile())
					fs.unlinkSync(filePath);
				else
					rmDir(filePath);
			}
		if (removevself)
			fs.rmdirSync(dirPath);
	},

}
);
