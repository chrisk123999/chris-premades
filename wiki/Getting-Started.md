# Getting Started with Cauldron of Plentiful Resources for First-Time Users
  
## Installing Dependencies
FoundryVTT should automatically ask if you want to install any missing dependencies when you install Cauldron of Plentiful Resources for the first time. However, sometimes modules fail to install or are for a newer version of the D&D System or FoundryVTT than Cauldron of Plentiful Resources supports. A list of required dependencies and their minimum versions can be found [here](https://github.com/chrisk123999/chris-premades#required-modules).
  
_This is the most common issue with enabling the module_
  
## Dependency Settings
Midi-QOL:
- `Roll Automation Support`: **true** _main settings_
- `Apply Convenient Effects`: **Apply Item effects, if absent, apply CE** _workflow settings -> workflow tab -> specials_
- `Merge Rolls to one card`: **true** _workflow settings -> misc tab_
- `Auto roll damage`: **Always OR Damage Roll Needed** _workflow settings -> gm tab AND player tab_
  
_Workflow Settings -> QuickSettings -> **Full Automation: As few button presses as possible** is a good start_
  
Dynamic effects using Active Effects (DAE):
- `Display results of inline rolls`: **true** _This setting is STRONGLY recommended so that features that use DAE's inline rolling will actually display_
  
Once you have your settings ready, check the [home page](https://github.com/chrisk123999/chris-premades/wiki) of the CPR wiki for information on how the module functions. For more information of CPR's own settings, see [CPR's settings](https://github.com/chrisk123999/chris-premades/wiki/Info#settings)

## How to use the Module
### For Individual Items
The easiest way to use a CPR automation on an individual item is to go through the item's Medkit. The first time and item is "Medkitted", it's name must be an _exact_ match to the item in CPR's compendiums. This means the name must be in English, spelled correctly, and using the name as formatted by DDBI. Some items vary between the included SRD compendiums and DDBI's importing of items. CPR's items go off the DDBI imported names.

![UnmedkittedItemTitlebar](https://github.com/user-attachments/assets/32f5a91d-ae54-45d6-8dca-501940e13922)

This item has a yellow-colored Medkit because there is an automation available to apply. Clicking it will show the item Medkit, with a dropdown to select available automations matching the item's name. Clicking the Apply button will apply the automation to the item, and will add the Configuration tab to the Medkit for applicable items.<br>

![MedkitDropdown](https://github.com/user-attachments/assets/9e083e61-9a39-41fc-8c5b-ce0ceed9e343)

The configuration tab of an item will have categories of customization options for an item. Most of these will be cosmetic, such as animations or Summons' names. Any options that change the functioning of an automation are considered "Homebrew" customizations and are a different permission level, set in the general settings menu of CPR. Players without permissions to change automations or configurations will be able to view them, but the inputs they do not have permission for will be disabled.<br>

![ConfigurationTab](https://github.com/user-attachments/assets/f4d3e37e-f9d9-4cdf-842c-8177b5865c9b)

Once the item has its automation applied, most automations will work without any further set up required. However, some automations may need compendium options to be selected in the CPR settings. CPR uses it's own API to function, and thus will not display any on use item or on use actor macros. As long as the Medkit is the intended color, the automation is applied.<br>

### On an Actor
The Medkit icon on an actor's title bar opens the actor Medkit, which gives an overview of the automations on an actor. This Medkit does not include any configuration options. Clicking the Update button will apply automations according to the priorities in CPR's Additional Compendiums setting, or will update the current automation on an item. A Summary tab will then display with the updated items and their sources.

![ActorMedkitTooltip](https://github.com/user-attachments/assets/2e767749-484e-4e84-acca-ddcb8774aa00)

### With DDBI
Cauldron of Plentiful Resources was design with DDBI in mind. CPR is best used in conjunction with DDBI and importing characters through it from DDB.<br>

_For Characters:_ On the D&D Beyond Importer pop-up window, on the `Active Effects` tab, enable `Use effects from Chris's Premades module?`. This will automatically replace features included in the module.<br>
  
_For Monsters:_ In the compendiums sidebar tab, on the DDB Muncher popup window, enable `Use effects from Chris's Premades module?...`. This will automatically replace monster features when munching them. You will need to Spell Munch before Monster Munch to include those features.<br>

_A Note on Compendiums:_ CPR has multiple automations which require pulling items from specified compendiums. These are best fulfilled with compendiums created by DDBI. Munching Items, Spells, and Monsters is highly recommended, as items imported by DDBI are the standard that CPR is developed off of, and will work best with.<br>
  
## General Settings
  
Most settings here will be on by default and won't necessarily need to be changed. However, the Class Spell List setting needs to be set up in order for features that use spells lists to work.
  
### Class Spell List
  
The Class Spell List setting requires a single journal with Spell List type pages. This must either be created by hand or imported from the SRD compendiums. Keep in mind the SRD compendium will have non-automated spells linked to them and will not include non-srd spells. These journal pages each need to have the same `Identifier` as the relevant class. You can then drag in spells from a compendium to add to the spell list. It is recommended to use DDBI munched spells. This journal must be kept in the sidebar.

![SpellList](https://github.com/user-attachments/assets/b34a3892-011b-47a9-aadf-99a170cfce65)

## Compendiums Settings

One last thing to check before diving into using CPR's automated items is the **Compendium Options** menu in the CPR settings. It is a good idea to look at each of the settings in here to confirm they are using your preferred compendiums. By default, it will select DDBI compendiums, and it is recommended to use munched compendiums from DDBI, CPR is tested with items formatted from DDBI.<br>

![CompendiumMenu](https://github.com/user-attachments/assets/e2719543-d8e5-45c8-b8df-eb021cf78202)