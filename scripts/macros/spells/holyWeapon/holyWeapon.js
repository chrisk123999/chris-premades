import {chris} from '../../../helperFunctions.js';
async function holyWeaponItem(workflow) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    async function effectMacro() {
        let damageDice = '2d8[radiant]';
        let generatedMenu = [];
        let mutationStack = warpgate.mutationStack(token.document);
        actor.items.forEach(item => {
            if (item.type === 'weapon' && item.system.equipped === true) {
                let mutateItem = mutationStack.getName('Holy Weapon: ' + item.name);
                if (!mutateItem) generatedMenu.push([item.name, item.id]);
            }
        });
        let selection;
        if (generatedMenu.length === 0) return;
        if (generatedMenu.length === 1) selection = generatedMenu[0][1];
        if (!selection) selection = await chrisPremades.helpers.dialog('What weapon?', generatedMenu);
        if (!selection) return;
        let weaponData = actor.items.get(selection).toObject();
        weaponData.system.damage.parts.push([damageDice, 'radiant']);
        weaponData.system.properties.mgc = true;
        let spellDC = chrisPremades.helpers.getSpellDC(origin);
        let featureData = await chrisPremades.helpers.getItemFromCompendium('chris-premades.CPR Spell Features', 'Holy Weapon - Burst', false);
        if (!featureData) return;
        featureData.system.description.value = chrisPremades.helpers.getItemDescription('CPR - Descriptions', 'Holy Weapon - Burst', false);
        featureData.effects[0].changes[0].value = 'label=Holy Weapon - Burst (End of Turn),turn=end,saveDC=' + spellDC + ',saveAbility=con,savingThrow=true,saveMagic=true,saveRemove=true';
        featureData.system.save.dc = spellDC;
        let updates = {
            'embedded': {
                'Item': {
                    [weaponData.name]: weaponData,
                    [featureData.name]: featureData
                }
            }
        };
        let options = {
            'permanent': false,
            'name': 'Holy Weapon: ' + weaponData.name,
            'description': 'Holy Weapon: ' + weaponData.name
        };
        await warpgate.mutate(token.document, updates, {}, options);
        let macro = "await warpgate.revert(token.document, '" + 'Holy Weapon: ' + weaponData.name + "');"
        await effect.createMacro('onDelete', macro);
    }
    let effectData = {
        'label': 'Holy Weapon',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 600
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onCreate': {
                    'script': chris.functionToString(effectMacro)
                }
            },
        }
    };
    await chris.createEffect(targetToken.actor, effectData);
}
async function holyWeaponBurstItem(workflow) {
    let effect = chris.findEffect(workflow.actor, 'Holy Weapon');
    if (!effect) return;
    await effect.delete();
    await chris.removeCondition(workflow.actor, 'Concentrating');
}
export let holyWeapon = {
    'item': holyWeaponItem,
    'burst': holyWeaponBurstItem
}