var v_self1;
Module.register("MMM-SleepWake",{
							previously_hidden: [],
							defaults: {
												delay: 15,
												source: 'external',
												mode:  'hide',
												detectionDir: '/home/odroid/MagicMirror/MMM-SleepWake/motion',
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
														v_self1.previously_hidden.push(module.identifier)
												 else
														// hide this module
														module.hide(1000);
											});
										break;
										case 'SLEEP_WAKE':
											 MM.getModules().enumerate((module) => {
													// if this module was NOT in the previously hidden list
													//Log.log("looking for module ="+module.name+" in previous list");
													if(v_self1.previously_hidden.indexOf(module.identifier)==-1)
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
									//Log.log("payload="+JSON.stringify(payload));
									switch(notification) 
									{
										case 'ALL_MODULES_STARTED':
												v_self1=this;
												if(v_self1.config.mode.toUpperCase()!=='PIR' || !this.PIR_Loaded())
														v_self1.sendSocketNotification("config", v_self1.config);
												else
														Log.log("MMM-PIR-Sensor loaded, defering");
										break;
										case 'STAND_BY':
											Log.log("received notification about sleep from "+ sender.name)
											if(sender.name=='MMM-voice' || sender.name=='MMM-PIR-Sensor')
												v_self1.sendSocketNotification(notification,payload);
                      Log.log("config="+v_self1.config.mode.toUpperCase())
											if(v_self1.config.mode.toUpperCase()==='HIDE' && payload.status === true){
												Log.log("previously hidden module identifiers="+payload.modules);
												// loop thru the modules
												MM.getModules().enumerate((module) => {
													// if this module should be in the previously hidden list
													if(payload.modules.indexOf(module.identifier) !== -1)
													{														
														// save it
														v_self1.previously_hidden.push(module.identifier)
													}
											 });
											}
										break;
									}
							},
})