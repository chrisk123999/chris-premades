Creating a template that applies effects is done via specific flags set on a template.  
`flags.chris-premades.template.name` - Internal name of the template effect, used to prevent effects from doubling up in the case of overlapping template effects. Required.  
`flags.chris-premades.template.castLevel` - Cast level of the template effect.  Used to help pick the "best" effect when template effects overlap. Optional.  
`flags.chris-premades.template.saveDC` - Save DC of the template effect. Used to help pick the "best" effect when template effects overlap. Optional.  
`flags.chris-premades.template.turn` - Should the effect trigger at the start or end of a combat turn. Valid types are: "start" and "end". Optional.  
`flags.chris-premades.template.ignoreMove` - Don't trigger this effect when the token moves. Must be true or false. Optional.  
`flags.chris-premades.template.templateUuid` - The uuid of the template. Required.  
`flags.chris-premades.template.worldMacro` - The world macro that is called when a token becomes a valid target of the template effect. Required if not using global function.  
`flags.chris-premades.template.globalFunction` - A global function that is called when a token becomes a valid target of the template effect. Required if not using a world macro.  
`flags.chris-premades.template.macroName` - Used by CPR for hard-coded effect templates.  You should never need to use this normally.  
  
The world macro or global function is called by CPR with the following arguments:  
`token` The token that the template effect is targeting.  
`triggerData` Contains the passed in information from the above flags.  With this you can handle creating and removing effects as needed by your template effect.  
  
[Cloudkill](https://github.com/chrisk123999/chris-premades/blob/master/scripts/macros/spells/cloudkill.js) is a good example of how to implement your own template effect.
