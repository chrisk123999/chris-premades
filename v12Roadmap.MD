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
[ ] Remake medkit config w/ Appv2
- [ ] Function to match name of item w/ all available automations
- [/] Functions to grab current versioning data
- [ ] App class itself
    - [ ] Handlbars templates for header, navigation, each tab
    - [ ] Functionality to select avail automation and apply it
    - [ ] Likely a bunch of CSS
[ ] Convert all helper functions
## Replace old dependencies
### Warpgate
[x] warpgate.wait() - now genericUtils.sleep
[ ] warpgate.spawn()
[x] warpgate.menu()/dialog() - now DialogApp / dialogUtils
[x] warpgate.crosshairs()-- - now Crosshairs
[ ] warpgate.mutate()
### Dfred's CE
[?] Effect sidebar thing
[?] Effect thing or macro.StatusEffect
### Token Attacher
[ ] Attachng templates
### Automated Animations
[ ] Teleport function
### Effect Macro
[ ] Replaced by internal hook calls
## Convert/update/fix all old functions
[ ] Redo artificer infusions and items that add items