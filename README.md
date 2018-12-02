## This bundle is outdated and unneeded; nodecg-speedcontrol now has a way to recover lost time built in if the server has to restart. It is being left here as reference!

# timer-speedcontrol

An external timer script to be used with [nodecg-speedcontrol](https://github.com/speedcontrol/nodecg-speedcontrol), which you may use in case you are worried about the NodeCG server crashing, which can be resumed once it has restarted, but with the current implementation results in the timer becoming paused.

## Usage

Assuming you already have Node.js installed (which is needed for NodeCG)...

* Clone the git repo using your preferred method ([you can download a ZIP for the latest release](https://github.com/speedcontrol/timer-speedcontrol/releases/latest)).
* Install the npm dependencies (`npm install`).
* Add `"useExternalTimer": true` to your [nodecg-speedcontrol.json config file](https://github.com/speedcontrol/nodecg-speedcontrol/blob/master/READMES/SpeedcontrolConfiguration.md).
* Run this script using `node index.js`.
* Run your NodeCG server.

This script and the NodeCG server must be run on the same server/computer.
