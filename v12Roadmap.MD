# v12 Roadmap
Goals:
- Make less settings
- Helper functions split into seperate files and better organized
- Imports/exports better organized
- All macros get called and executed with a queue
- Move config bits into individual macro files

## To do list: (x: done, /: halfway, ?: unsure)
- [x] Create system for calling macros within a queue
- [x] Additional compendiums Appv2
- [x] Remake medkit config w/ Appv2
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
- [x] Effect Medkit
    - [x] Main tab 
        - [x] {{selectMultiple}} for flags.chris-premades.conditions generated from CONFIG.statusEffects, 
        - [x] checkbox for flags.chris-premades.noAnimation
    - [x] Overtime creator, dynamically update
        - [x] Make the saveDC save correctly (get rid of extranous values in the overTime)
    - [x] DevTools tab to set flags on effect
    - [x] Colorize effect medkit
    - [x] Add dev tools part for `effect.flags['chris-premades']?.macros?.midi?.actor`
- [ ] Actor Medkit
    - [x] Character tab
    - [ ] NPC tab
    - [x] Summary tab
- [ ] Convert all helper functions
- [ ] Summons
    - [x] Main Summons class, spawning, effects, dependents, initiative, despawning
    - [ ] helper functions
        - [x] Get attack modifiers/spell save DCs
        - [x] CR calculating functions
        - [ ] Token config getters?
        - [x] Item getter? (itemName, {updates}) will get item, description, and then merge its updates
        - [ ] No target option and set height to 0.001, 'flags.wall-height.tokenHeight', 0.001
  
## Replace old dependencies
### Warpgate
- [x] warpgate.wait() - now genericUtils.sleep
- [x] warpgate.spawn()
    - [x] Helper functions spawn function
        - [x] spawning part
    - [x] Convert summons.js and tashaSummon.js and merge what's possible
- [x] warpgate.menu()/dialog() - now DialogApp / dialogUtils
- [x] warpgate.crosshairs() - now Crosshairs
- [ ] warpgate.mutate()
### Dfred's CE
- [x] Effect sidebar thing
- [x] Effect thing or macro.StatusEffect
### Token Attacher
- [x] Attachng templates
### Automated Animations
- [x] Teleport function
### Effect Macro
- [x] Replaced by internal hook calls
  
## Convert/update/fix all old functions
- [x] Spells
- [ ] Class features
    - [x] Official content
    - [ ] Critical role content (blood hunter and gunslinger)
        - [x] Blood hunter
        - [ ] Gunslinger
- [x] Race Features
- [ ] Items
- [ ] Monster Features
    - [ ] Actual one-off features
        - [ ] Autognome malfunction
        - [ ] Bulette Deadly leap
        - [ ] Dream Eater Engulfing Nightmare
        - [ ] Elder Brain
        - [ ] Eat Memories Elder Oblex
        - [ ] Gallows Speaker Suffering Echos
        - [ ] Gibbering Mouther Gibbering
        - [ ] Intellect Devourer Devour Intellect
        - [ ] Piercer drop
        - [ ] Rug of smothering damage transfer
        - [ ] Shader-kai soul monger soul thirst
        - [ ] Trixie tockworth force field
    - [ ] Generic features
        - [x] Keen hearing/smell/sight {skill, label {sight, hearing, smell}}
        - [x] Berserk (Hit point amount, die roll, on a) (Golems)
        - [/] Can see eyes on the start of turn... (ie Bodak Death Gaze) (save, if fails by 5 or more, damage, distance)
        - [ ] Fails by 5 or more (immunity to condition, callback function (reduce to 0hp, falls unconscious))
        - [x] Aura of damage on end of other's turn (ie Aura of Annihilation) (damage, distance, creature immunity)
        - [x] Surprise attack (combat round 1, dialog, damage)
        - [ ] Starts turn within rnage, save, immune for 24hrs on save (ie chasme drone) (save, effect, condition immunity, immunity time, immunity to one or all)
        - [x] Target's max  hitpoints (reduced by half?) the [damageType] taken (ie chasme proboscis, clay golem slam) (which damage, save if any) (short or long rest)
            - [x] Or reduced by a roll (1d6) 
        - [ ] Specified target takes damage at the start of the attacker's turn (ie clockwork defender bite)
        - [ ] Spell turning, adv on throws that only target it, spell of [level] or lower has no effect on save (ie crag cat) (if advantage, level, targets caster)
        - [ ] Contextual bonuses (deep gnome stone camoflauge)
        - [ ] Enlarge only (duergar)
        - [ ] Reduce only (mind master)
        - [ ] Sunlight sensitivity (dis on attack rolls, skill check certainly)
        - [ ] Touches or hitting it you take damage (ie fire elemental fire form, fire snake heated body) (damage)
        - [ ] Auto grapple
        - [ ] Swarm damage
        - [ ] Regeneration
        - [ ] Parry
        - [ ] Grappler advantage on attacks against things its grappling (grell tentables, mimic)
        - [ ] Discount sneak attack (hobgoblin martial advantage)
        - [ ] Pack tactics
        - [ ] Death burst (save, effect)
        - [ ] Death throes (save, damage)
        - [ ] Immune to effect for [time] on save
        - [ ] Strength drain (roll for drain, short/long rest)
        - [ ] Different damage if advantage on the attack (shadow demon claws)
        - [ ] Engulf (rug of smothering, shambling mound)
        - [x] Undead fortitude 
  
## Extensions
- [x] Update summon iniative/update companion initiative
- [x] Options for items to add for add generic actions setting
- [ ] Make all medkit coloring use a constants/setting to support a colorblind mode
- [x] Clean up the CSS
- [ ] Document things