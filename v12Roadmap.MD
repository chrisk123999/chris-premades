** v12 Roadmap **
Goals:
- Make less settings
- Helper functions split into seperate files and better organized
- Imports/exports better organized
- All macros get called and executed with a queue
- Move config bits into individual macro files

Mile Markers:
- Create system for calling macros within a queue
- Remake medkit config w/ Appv2
- Convert all helper functions
- Replace old dependencies
    - Warpgate
        - warpgate.wait() - now genericUtils.sleep
        - warpgate.spawn()
        - warpgate.menu()/dialog() - now DialogApp / dialogUtils
        - warpgate.crosshairs() - now Crosshairs
        - warpgate.mutate()
    - Dfred's CE
        - Effect sidebar thing
        - Effect thing or macro.StatusEffect
    - Token Attacher
        - Attachng templates
    - Automated Animations
        - Teleport function
    - Effect Macro
        - Replaced by internal hook calls
- Convert/update/fix all old functions
    - Redo artificer infusions and items that add items

game.compendiums.filter(i => i.metadata.type === 'Item');
settings:
    {
        id: compendiumId,
        priority: 0-100
    }