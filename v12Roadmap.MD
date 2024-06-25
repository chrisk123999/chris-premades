# v12 Roadmap
Goals:
- Make less settings
- Helper functions split into seperate files and better organized
- Imports/exports better organized
- All macros get called and executed with a queue
- Move config bits into individual macro files

## To do list: (x: done, /: halfway, ?: unsure)
[x] Create system for calling macros within a queue
[x] Additional compendiums Appv2
[x] Remake medkit config w/ Appv2
- [x] Function to match name of item w/ all available automations
- [x] Functions to grab current versioning data
- [x] App class itself
    - [x] Handlbars templates for header, navigation, each tab
    - [x] Functionality to select avail automation and apply it
    - [x] Likely a bunch of CSS
        - [x] Lay out header and info tab better
        - [x] Give navigation some spacing and definition WITHOUT killing the good parts of the native CSS
        - [x] Make header not ugly (font etc)
        - [!] Make tooltips a little smaller? - can't really, the display for them is just on the overall window, not the apps themselves...
    - [x] onFormChange correctly setting the value of each input in the internal context
    - [x] confirm button to set config info on item
    - [x] Determine if things are touchable based off permissions, set tooltip if not
    - [ ] Improve devTools tab
        - [x] Field to add Item and Actor on use macros, turn it into an array.
        - [ ] (optional?) Button to clear configs
        - [x] fields to set identifier and other bits but with it prefilled
[ ] Convert all helper functions
[ ] Summons
## Replace old dependencies
### Warpgate
[x] warpgate.wait() - now genericUtils.sleep
[ ] warpgate.spawn()
    - [x] Helper functions spawn function
        - [x] spawning part
    - [ ] Convert summons.js and tashaSummon.js and merge what's possible
[x] warpgate.menu()/dialog() - now DialogApp / dialogUtils
[x] warpgate.crosshairs()-- - now Crosshairs
[ ] warpgate.mutate()
### Dfred's CE
[x] Effect sidebar thing
[?] Effect thing or macro.StatusEffect
### Token Attacher
[ ] Attachng templates
### Automated Animations
[ ] Teleport function
### Effect Macro
[x] Replaced by internal hook calls
## Convert/update/fix all old functions
[ ] Redo artificer infusions and items that add items