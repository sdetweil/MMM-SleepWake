# MMM-SleepWake  [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/fewieden/MMM-voice/master/LICENSE) [![Build Status](https://travis-ci.org/fewieden/MMM-voice.svg?branch=master)](https://travis-ci.org/fewieden/MMM-voice) [![Code Climate](https://codeclimate.com/github/fewieden/MMM-voice/badges/gpa.svg?style=flat)](https://codeclimate.com/github/fewieden/MMM-voice) [![Known Vulnerabilities](https://snyk.io/test/github/fewieden/mmm-voice/badge.svg)](https://snyk.io/test/github/fewieden/mmm-voice) [![API Doc](https://doclets.io/fewieden/MMM-voice/master.svg)](https://doclets.io/fewieden/MMM-voice/master)

Sleep/Wake module for MagicMirror<sup>2</sup>, using some external source for motion detection 

## Information

If you want your MagicMirror to go to sleep (hide all content/turn off) when no-one is around, and you have a webcam
you can use the github motion project to provide motion detection events, this module will integrate that with MagicMirror


## Dependencies

* An installation of [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror)
* Packages: no additional packages, uses file based events
* A camera of some sort, supported by the Motion project (https://motion-project.github.io/)


## Installation

1. Clone this repo into `~/MagicMirror/modules` directory.

1. Configure your `~/MagicMirror/config/config.js`:

    ```
    {
        module: 'MMM-SleepWake',
				delay:  15,               // default
        source: 'external',
        mode:  see below,
					// detectionDir: folder containing externally generated file when motion starts
	  			//							 will be created if needed
		  		// detectionFile:  filename generated for motion start. default = 'detected'
				
				
    }
    ```

## Config Options

| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `source` | REQUIRED | 'external' |
| `delay` | OPTIONAL | `15` | amaount of time with no motion before sleeping|
| `mode` | OPTIONAL | 'PI' |  use the tvservice command available on Raspberry pi to turn off the HDMI monitor source
|  |  | 'DPMS' |  use the exec DMPS command to turn off the monitor source (not on pi, or not hdmi)
|  |  | 'HIDE' |  hide all module content, if display is on EnergyStar device that shows ugly screen no signal screen for the other two choices
| `detectionDir` | OPTIONAL | '/home/{userid}/MagicMirror/modules/MMM-SleepWake/motion'  |  the path to the folde that will received the motion notification files from the external_motion script
| `detectionFile` | OPTIONAL|  filename generated for motion start. default = 'detected' | the name of the file in the detectionDir folder that indicates motion started

## Usage

configure the github motion project (or whatever method you want to detect motion) to write a file for motion start or end. 

like this (motion.conf lines)
# Command to be executed when an event starts. (default: none)
# An event starts at first motion detected after a period of no motion defined by event_gap
on_event_start /home/{userid}/MagicMirror/modules/MMM-SleepWake/external_motion started

# Command to be executed when an event ends after a period of no motion
# (default: none). The period of no motion is defined by option event_gap.
on_event_end /home/{userid}/MagicMirror/modules/MMM-SleepWake/external_motion ended

I have submitted changes to the MMM-voice and HelloLucy projects to help communicate between our modules,
that way voice initiated sleep (go to sleep) and motion initiated wakeup will restore the mirror to the prior state (and vice versa)

