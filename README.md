# MMM-SleepWake

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
        config:{
           delay:  15,               // default
           mode:  see below
        }
    }
    ```

## Config Options

all options are case insensitive, (all lower, mixed or all uppercase supported)

| **Option** | **Default** | **Description** | **Info**
| --- | --- | --- | --- |
| `delay` | `OPTIONAL` | `15` | amount of time with no motion before sleeping, in minutes|
| `mode` | `OPTIONAL` | |
|        |          |'PI' |  use the tvservice command available on Raspberry pi to turn off the HDMI monitor source
|  |  | 'DPMS' |  use the exec DMPS command to turn off the monitor source (not on pi, or not hdmi)
|  |  | 'CEC' |  use the exec cec-client command to turn off the monitor source (not on pi, or not hdmi)
|  |  | `'HIDE'` |  hide all module content, if display is on EnergyStar device that shows ugly 'no signal' screen for the other two choices (`default`)
|  |  | `PHOTOFRAME` | surface a particular page (on page based systems) when people aren't around, return to normal when people are detected
|`photoframe_start_notification` | `OPTIONAL` | `null` | notification to be received on request to start photoframe mode. <br> maybe when no one is around,<br> must be specified if the photoframe  option is used `{"notification":"xxxxx","payload":"yyyy"}` <br><br>on the payload, true, false and null must not be quoted|  
|`photoframe_end_notification` | `OPTIONAL` | `null` | notification to be received on request to end photoframe mode,<br> maybe when someone has appoached the mirror, <br>must be specified if the photoframe  option is used `{"notification":"xxxxx","payload":"yyyy" }`  <br><br>on the payload, true, false and null must not be quoted |  
| `pi_on` | `OPTIONAL`|default: "/opt/vc/bin/tvservice -p && sudo chvt 6 && sudo chvt 7" | command string to execute when the pi should turn on the hdmi output|
| `pi_off`| `OPTIONAL` |default: "/opt/vc/bin/tvservice -o"|command string to execute when the pi should turn on the hdmi output|
|`dpms_on`|`OPTIONAL`| default: "xset dpms force on" |command string to execute when the pi should turn on the hdmi output using xset|
|`dpms_off`|`OPTIONAL`| default: "xset dpms force off" |command string to execute when the pi should turn on the hdmi output using xset|
|`cec_on`|`OPTIONAL`| default: "echo on 0 \| cec-client -s" |command string to execute when the pi should turn on the hdmi device using cec-client|
|`cec_off`|`OPTIONAL`| default: "echo standby 0 \| cec-client -s" |command string to execute when the pi should turn off the hdmi device using cec-client|
| debug | `OPTIONAL`| false| enable logging of actions and events |

## Usage

configure the github motion project (or whatever method you want to detect motion) to write a file for motion start or end.

like this (motion.conf lines), below (without the . in front) replace {userid} with the userid under which MagicMirror will be executing (typically 'pi' on Raspberry PI devices)

*# Command to be executed when an event starts. (default: none)
*# An event starts at first motion detected after a period of no motion defined by event_gap

 on_event_start /home/{userid}/MagicMirror/modules/MMM-SleepWake/external_motion started

*# Command to be executed when an event ends after a period of no motion
*# (default: none). The period of no motion is defined by option event_gap.

 on_event_end /home/{userid}/MagicMirror/modules/MMM-SleepWake/external_motion ended

I have submitted changes to the MMM-voice and HelloLucy projects to help communicate between our modules,
that way voice initiated sleep (go to sleep) and motion initiated wakeup will restore the mirror to the prior state (and vice versa)
