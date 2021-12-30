

Module.register("MMM-SleepWake",{
	previously_hidden: [],
	defaults: {
		delay: 15,
		source: 'external',
		mode:  "hide",
		ndetectionDir: "/motion",
		ndetectionFile: "detected",
		pi_off: "/opt/vc/bin/tvservice -o",
		pi_on: "/opt/vc/bin/tvservice -p && sudo chvt 6 && sudo chvt 7",
		dpms_off: "xset dpms force off",
		dpms_on: "xset dpms force on",
		cec_on:"echo on 0 | cec-client -s",
		cec_off:"echo standby 0 | cec-client -s",
		debug: true
	},

	socketNotificationReceived: function(notification, payload)
	{
		let self = this;
		Log.log("sleep/wake in socketNotificationReceived");
		Log.log("notification='"+notification+"'");

		switch(notification)
		{
		case "SLEEP_HIDE":
			MM.getModules().enumerate((module) => {
				// if the module is already hidden
				if(module.hidden==true)
					// save it for wake up
					{self.previously_hidden.push(module.identifier);}
				else
					// hide this module
					{module.hide(1000);}
			});
			break;
		case "SLEEP_WAKE":
					 MM.getModules().enumerate((module) => {
				// if this module was NOT in the previously hidden list
				//Log.log("looking for module ="+module.name+" in previous list");
				if(self.previously_hidden.indexOf(module.identifier)==-1)
				{
					// show it
					module.show(1000);
				}
					 });
			// clear the list, if any
			self.previously_hidden = [];
			break;
		}
	},
	PIR_Loaded: function(){
		let rc=false;
		MM.getModules().enumerate((module) => {
			if(module.name=="MMM-PIR-Sensor"){
				rc=true;
			}
		});
		return rc;
	},

	notificationReceived: function(notification, payload, sender){
		let self = this;
		//Log.log("sleep-wake in notificationReceived");
		//Log.log("notification='"+notification+"'");
		//Log.log("sender="+sender);
		//Log.log("payload="+JSON.stringify(payload));
		switch(notification){
		case "ALL_MODULES_STARTED":
			//self=this;
			if(self.config.mode.toUpperCase()!=="PIR" || !this.PIR_Loaded())
			{
				//Log.log("SleepWake config="+JSON.stringify(self.config));
				self.sendSocketNotification("config", self.config);
			}
			else
			{Log.log("MMM-PIR-Sensor loaded, defering");}
			break;
		case "STAND_BY":
			Log.log("received notification about sleep from "+ sender.name);
			if(sender.name=="MMM-voice" || sender.name=="MMM-PIR-Sensor")
				{self.sendSocketNotification(notification,payload);}
			Log.log("config="+self.config.mode.toUpperCase());
			if(self.config.mode.toUpperCase()==="HIDE" && payload.status === true){
				if( sender.name == "MMM-AssistantMk2" && payload.triggerHide === true){
					//
					Log.log("MMM-AssistantMk2 says go to sleep");
					this.sendSocketNotification("START_SLEEP", null);
				}
				else {
					Log.log("previously hidden module identifiers="+payload.modules);
					// loop thru the modules
					MM.getModules().enumerate((module) => {
						// if this module should be in the previously hidden list
						if(payload.modules.indexOf(module.identifier) !== -1)
						{
							// save it
							self.previously_hidden.push(module.identifier);
						}
					});
				}
			}
			break;
		case 'USER_PRESENCE':
		  if(sender.name == 'MMM-PIR-Sensor'){
				if(payload == true){
					Log.log("received notice user around")
					self.sendSocketNotification("END_SLEEP");
				}
				else{
					Log.log("received notice user no longer around")
				  self.sendSocketNotification("START_SLEEP");
				}
			}
			break;
		case 'MONITOR_ACTION':
			if(sender.name =='MMM-AlexaControl'){
				if(payload == 'SLEEP_WAKE'){
					self.sendSocketNotification("END_SLEEP");
				}
				else{
					self.sendSocketNotification("START_SLEEP");
				}
			}
		    break;
		}
	},
});
