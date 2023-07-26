Creating an effect aura around an actor is done via applying specific flags to the actor (normally via the use of an effect).  
`flags.chris-premades.aura.NAME.name` - Internal name of the aura, used to prevent auras from doubling up in the case of overlapping effect auras. Required.  
`flags.chris-premades.aura.NAME.castLevel` - Cast level of the aura.  Used to help pick the "best" aura when effect auras overlap. Optional.  
`flags.chris-premades.aura.NAME.spellDC` - Save DC of the aura. Used to help pick the "best" aura when effect auras overlap. Optional.  
`flags.chris-premades.aura.NAME.range` - Range of the aura.  Range in feet of the aura, may also be "paladin" to switch between 10 and 30 depending on the Paladin level. Required.  
`flags.chris-premades.aura.NAME.disposition` - Limits the aura to a certain disposition. Valid types are: "all", "ally", "enemy". Optional.  
`flags.chris-premades.aura.NAME.conscious` - Only emit the aura if the actor is conscious. Must be true or false. Optional.  
`flags.chris-premades.aura.NAME.effectName` - The name of the effect. Should be the name of the effect that gets applied. Required.  
`flags.chris-premades.aura.NAME.worldMacro` - The world macro that is called when an actor becomes a valid target of the effect aura. Required if not using global function.  
`flags.chris-premades.aura.NAME.globalFunction` - A global function that is called when an actor becomes a valid target of the effect aura. Required if not using a world macro.  
`flags.chris-premades.aura.NAME.macroName` - Used by CPR for hard-coded auras.  You should never need to use this normally.  
  
The world macro or global function is called by CPR and provides the following arguments:  
`token` - The token that the aura is targeting.  
`auraData` - Contains the passed in information from the above flags.  With this you can handle creating and removing effects as needed by your effect aura.  
  
Lastly, if the effect aura is temporary in nature, you will need to call the function `chrisPremades.effectAuras.add` to kick start the effect aura application.  You will also need to use `chrisPremades.effectAuras.remove` when the temporary effect aura is to be removed.  
[The Lantern of Revealing](https://github.com/chrisk123999/chris-premades/blob/master/scripts/macros/items/lanternOfRevealing.js) is a good example of how to implement your own effect aura with this module.