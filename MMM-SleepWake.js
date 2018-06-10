var v_self1;
Module.register("MMM-SleepWake",{
							previously_hidden: [],
							defaults: {
												delay: 5,
												source: 'PIR',
												mode:  'PI',
												detectionDir: '/home/pi/smart-mirror/motion',
												detectionFile: 'detected',
							},
							socketNotificationReceived: function(notification, payload)
							{
									Log.log("sleep/wake in notificationReceived");
								  Log.log("notification='"+notification+"'");

									switch(notification) 
									{	
										case 'SLEEP_HIDE':
											MM.getModules().enumerate((module) => {
												 // if the module is already hidden
												 if(module.hidden==true)
														// save it for wake up
														v_self1.previously_hidden.push(module)
												 else
														// hide this module
														module.hide(1000);
											});
										break;
										case 'SLEEP_WAKE':
											 MM.getModules().enumerate((module) => {
													// if this module was NOT in the previously hidden list
													//Log.log("looking for module ="+module.name+" in previous list");
													if(v_self1.previously_hidden.indexOf(module)==-1)
													{														
														// show it
															module.show(1000);
													}
											 });
											// clear the list, if any
											v_self1.previously_hidden = [];
										break;
									}
							},
							PIR_Loaded: function(){
								let rc=false;
								MM.getModules().enumerate((module) => {
									if(module.name=='MMM-PIR-Sensor'){
											rc=true;
											break;
									}
  							});
								return rc;
							},
							notificationReceived: function(notification, payload, sender)
							{
									Log.log("sleep-wake in notificationReceived");
								  Log.log("notification='"+notification+"'");
									Log.log("sender="+sender);
									Log.log("payload="+JSON.stringify(payload));
									switch(notification) 
									{
										case 'ALL_MODULES_STARTED':
												v_self1=this;
												if(v_self1.config.mode.toLowerCase()!=='PIR' || !this.PIR_Loaded())
														v_self1.sendSocketNotification("config", v_self1.config);
												else
														Log.log("MMM-PIR-Sensor loaded, defering");
										break;											
										case 'NOW_ASLEEP':
										case 'NOW_AWAKE':
											Log.log("received notification about sleep from "+ sender.name)
											if(sender.name=='MMM-voice' || sender.name=='MMM-PIR-Sensor')
												v_self1.sendSocketNotification(notification,payload);
											if(v_self1.config.mode=='HIDE' && notification =='NOW_ASLEEP'){
												Log.log("previously hidden modules names="+payload);
												// get the list of hidden module names
												let namelist=JSON.parse(payload);
												// loop thru the modules
												MM.getModules().enumerate((module) => {
													// if this module should be in the previously hidden list													
													if(namelist.indexOf(module.name)==-1)
													{														
														// save it
														v_self1.previously_hidden.push(module)
													}
											 });
											}
										break;
									}
							},
})