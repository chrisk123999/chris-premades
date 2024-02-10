import {chris} from '../../../../../helperFunctions.js';
async function create({speaker, actor, token, character, item, args, scope, workflow}) {
    let items = workflow.actor.items.filter(i => i.flags['chris-premades']?.feature?.createPactWeapon).map(j => j.id);
    if (items.length) await dismiss({'workflow': workflow});
    let pack = game.settings.get('chris-premades', 'Item Compendium');
    if (!game.packs.get(pack)) {
        ui.notifications.warn('Personal Item Compendium setting must be set!');
        return
    }
    let weapons = [
        'Club',
        'Dagger',
        'Greatclub',
        'Handaxe',
        'Javelin',
        'Light Hammer',
        'Mace',
        'Quarterstaff',
        'Sickle',
        'Spear',
        'Battleaxe',
        'Flail',
        'Glaive',
        'Greataxe',
        'Greatsword',
        'Halberd',
        'Lance',
        'Longsword',
        'Maul',
        'Morningstar',
        'Pike',
        'Rapier',
        'Scimitar',
        'Shortsword',
        'Trident',
        'War Pick',
        'Warhammer',
        'Whip'
    ];
    let improvedPactWeapon = chris.getItem(workflow.actor, 'Eldritch Invocations: Improved Pact Weapon');
    if (improvedPactWeapon) {
        weapons = weapons.concat([
            'Shortbow',
            'Longbow',
            'Crossbow, light',
            'Crossbow, heavy'
        ]);
    }
    let documents;
    try {
        documents = await Promise.all(weapons.map(async i => await chris.getItemFromCompendium(pack, i, true)));
    } catch {
        ui.notifications.warn('Personal Item Compendium is missing a required weapon for this feature!');
        return;
    }
    if (!documents.length) {
        ui.notifications.warn('Personal Item Compendium is missing the required weapons for this feature!');
        return;
    }
    let selection = await chris.selectDocument('Select a Pact Weapon', documents, false);
    if (!selection) return;
    selection[0].name += ' (Pact Weapon)';
    selection[0].system.proficient = true;
    selection[0].system.properties.mgc = true;
    let hexWarrior = chris.getItem(workflow.actor, 'Hex Warrior');
    if (hexWarrior) {
        let cha = workflow.actor.system.abilities.cha.mod;
        let ability = (selection[0].system.ability === '' || selection[0].system.ability === null) ? 'str' : selection[0].system.ability;
        let score = workflow.actor.system.abilities[ability].mod;
        let dex = workflow.actor.system.abilities.dex.mod;
        let changed = false;
        if (selection[0].system.properties.fin) {
            let mod = dex > score ? dex : score;
            if (mod <= cha) {
                ability = 'cha';
                changed = true;
            }
        } else {
            if (score <= cha) {
                ability = 'cha';
                changed = true;
            }
        }
        if (changed) selection[0].system.ability = ability;
    }
    if (improvedPactWeapon) {
        selection[0].system.attackBonus = 1;
        selection[0].system.damage.parts[0][0] += ' + 1';
    }
    selection[0].system.equipped = true;
    setProperty(selection[0], 'flags.chris-premades.feature.createPactWeapon', true);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Dismiss Pact Weapon');
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dismiss Pact Weapon');
    setProperty(featureData, 'flags.chris-premades.feature.createPactWeapon', true);
    selection.push(featureData);
    await workflow.actor.createEmbeddedDocuments('Item', selection);
}
async function dismiss({speaker, actor, token, character, item, args, scope, workflow}) {
    let items = workflow.actor.items.filter(i => i.flags['chris-premades']?.feature?.createPactWeapon).map(j => j.id);
    if (!items.length) return;
    await workflow.actor.deleteEmbeddedDocuments('Item', items);
}
export let createPactWeapon = {
    'create': create,
    'dismiss': dismiss
}