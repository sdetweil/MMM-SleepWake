var NodeHelper = require("node_helper");
var fs = require('fs');
var exec = require('child_process').exec;
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
							}		,
							socketNotificationReceived: function(notification, payload)
							{
								console.log("sleep-wake helper in socket notification="+notification);
								switch(notification.toUpperCase())
								{
									case 'CONFIG':
										vself.config=payload;
										vself.timeractive=setTimeout(vself.noUser,vself.config.delay*(60*1000));
										if(vself.config.source.toUpperCase() === 'EXTERNAL'){
											exec('/bin/chmod +x '+path.join(__dirname,"external_motion"), function (error, stdout, stderr) {
													if(error!=null)
													{
															console.log("change permissions failed "+JSON.stringify(error));
													}
											}); 

											if(vself.config.detectionDir=='/motion')
										  {
												  // its the default folder
													//console.log("full path="+path.join(__dirname,vself.config.detectionDir))
													vself.config.detectionDir= path.join(__dirname,vself.config.detectionDir)
													//console.log("setting detectionDir path from local folder ="+vself.config.detectionDir);
											}

//										  console.log(" external source defined");

										  console.log(" external source defined dir="+vself.config.detectionDir);

											// check to see if the external motion event folder exists
											fs.access(vself.config.detectionDir, function(err) {
												// if not
												if (err && err.code === 'ENOENT') {
													// create it
													fs.mkdir(vself.config.detectionDir);
													console.log('created motion directory', vself.config.detectionDir);
													exec('/bin/chmod 666 '+vself.config.detectionDir, function (error, stdout, stderr) {
													if(error!=null)
													{
															console.log("change permissions failed "+JSON.stringify(error));
													}
											});
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
												exec('/opt/vc/bin/tvservice -o',  function (error, stdout, stderr) {
													if(error!=null)
													{
															console.log("/opt/vc/bin/tvservice -o failed "+JSON.stringify(error));
													}
											});
												vself.hdmi = false;
												break;
											case 'HIDE':
												// tell the module so it can hide the others
												vself.sendSocketNotification('SLEEP_HIDE');
												break;
											case 'DPMS':
												/////////// Turns off laptop display and desktop PC with DVI  @ Mykle ///////////////
												exec('xset dpms force off',  function (error, stdout, stderr) {
													if(error!=null)
													{
															console.log("xset dpms force off failed "+JSON.stringify(error));
													}
											});
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
												exec('/opt/vc/bin/tvservice -p && sudo chvt 6 && sudo chvt 7',  function (error, stdout, stderr) {
													if(error!=null)
													{
															console.log("/opt/vc/bin/tvservice -p failed "+JSON.stringify(error));
													}
											});
												vself.hdmi = true;
												break;
											case 'HIDE':
												// tell the module so it can unhide the others
												vself.sendSocketNotification('SLEEP_WAKE');
												break;
											case 'DPMS':
												/////////// Turns on laptop display and desktop PC with DVI @ Mykle ///////////////
												exec('xset dpms force on', function (error, stdout, stderr) {
													if(error!=null)
													{
															console.log("xset dpms force on failed "+JSON.stringify(error));
													}
											});
												break;
										}
										if(vself.config.mode.toUpperCase()!=='HIDE')
											vself.sendSocketNotification('HW_AWAKE')
										break;
									case 'STAND_BY':
										if(payload.status === false) {
											vself.sleeping=false;
											vself.timeractive=setTimeout(vself.noUser,vself.config.delay*(60*1000));
										} else if (payload.status === true) {
											vself.sleeping=true;
											if(vself.timeractive)
												clearTimeout(vself.timeractive)
										}
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
