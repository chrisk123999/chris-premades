# What is Cauldron of Plentiful Resources?
The Cauldron of Plentiful Resources is a collection of automated items including spells, class features, monster features, etc., mechanics to make those possible, and quality-of-life based extensions for a high-automation Midi-QOL based D&D5e environment. There's three main places the module is interacted with from the user's perspective, the Medkit, the compendiums, and the Cauldron of Plentiful Resources Module Settings.

## The Medkit 
Cauldron of Plentiful Resources adds a button to the title bars of Actor and Item sheets to use to apply automations and configure available settings for those automations. The Item's Medkit allows for customization, the Actor's Medkit provides a quick way to apply or update available automations according to set settings.

### On Items

![ItemTitlebar](https://github.com/user-attachments/assets/d6b96203-32af-4c0e-aedc-bbf6ae45f528)

The Medkit on an Item Sheet's title bar will be colored based on it's status. Clicking it will open up the Item Medkit.<br>

![Medkit](https://github.com/user-attachments/assets/b1538e34-fd37-4f3a-98d5-6cc6aef080a9)

The Medkit will show information about the item, if there's an available automation, if it is up to date, and allows you to choose which automation is applied.<br>
The Medkit has multiple tabs which are different depending on the item. All items will have the info tab, items with configuration options will have a Configuration tab as well.<br>
Once an item has an automation applied, that item can be renamed, such as for translations, and will retain its ability to be updated. Item descriptions and flavor info will not be changed when an automation is applied or updated.<br>
Items on NPCs will have a Generic Features tab, this is where generic monster features can be added and customized to suit a variety of monster features.

### On Actors

![ActorTitlebar](https://github.com/user-attachments/assets/23311faf-fac1-4e51-af9a-7abd2f3353d3)

The Medkit on an Actor's title bar will open the Actor Medkit. The title bar icon on an actor's sheet will not be colored.

![ActorMedkit](https://github.com/user-attachments/assets/21224782-147a-44ef-94a9-054a29fd9e69)

The actor Medkit allows the mass application and updating of automations. Automations will be applied by their priority in the Additional Compendiums setting dialog. If an item has a differently selected automation, that will take priority.<br>
The actor Medkit also shows the amount of up to date, available, and out of date automations on an actor. Hovering over each box will show what the sources are.<br>
When the update button is clicked and the update is successful, a Summary tab will be shown with what automations were added or updated and what their sources are.<br>
Automations that don't have versioning, such as those from a personal override compendium, will always show as available and always be re-applied when the update button is clicked.

## The Compendiums

All automated items, including spells, feats, and items, are included in CPR's pack data, which you can see as compendiums in the compendium tab.

![Compendiums](https://github.com/user-attachments/assets/cae1e456-c3cf-430e-9067-1f35167e5a38)

This is where you can access every CPR item without using the Medkit. Keep in mind these items will not have descriptions, so it is typically better to use the Medkit on items with their descriptions already filled out.

## The Settings

Cauldron of Plentiful Resources has a lot of settings, most of them are for optional additional features that do not interact with item automations. Every setting has a brief description of what it does, however more info can be found [here](https://github.com/chrisk123999/chris-premades/wiki/Info#settings). It is recommended to turn on settings only as needed. Please do not turn on every setting without knowing what they add.

![Settings](https://github.com/user-attachments/assets/c10dde33-1ec8-496e-93f7-e9212541c6ce)

## Next Steps

These are the main places you will be interacting with Cauldron of Plentiful Resources directly. To get set up for the first time, check the getting started guide [here](https://github.com/chrisk123999/chris-premades/wiki/Getting-Started).<br>

Other clarifying info can be found on the [Info](https://github.com/chrisk123999/chris-premades/wiki/Info) page, such as what the Medkit colors mean, descriptions of settings, and answers to frequently asked questions.<br>

API Documentation for advanced users can be found here (no link yet WIP), along with a guide to modifying CPR's macros for yourself.<br>