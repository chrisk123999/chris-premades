import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let shieldOfFaith = itemUtils.getItemByIdentifier(workflow.actor, 'shieldOfFaith') ?? (await compendiumUtils.getItemFromCompendium(constants.modernPacks.spells, 'Shield of Faith'));
    let spiritualWeapon = itemUtils.getItemByIdentifier(workflow.actor, 'spiritualWeapon') ?? (await compendiumUtils.getItemFromCompendium(constants.modernPacks.spells, 'Spiritual Weapon'));
    if (!shieldOfFaith || !spiritualWeapon) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.ChooseASpell', [shieldOfFaith, spiritualWeapon]);
    if (!selection) return;
    let identifier = genericUtils.getIdentifier(selection);
    let selectionData = genericUtils.duplicate(selection.toObject());
    selectionData._id = foundry.utils.randomID();
    selectionData.system.activation.type = 'special';
    selectionData.system.duration.units = 'minute';
    selectionData.system.duration.value = '1';
    selectionData.system.properties = selectionData.system.properties.filter(i => i != 'concentration');
    selectionData.system.method = 'atwill';
    genericUtils.setProperty(selectionData, 'flags.chris-premades.warGodsBlessing.name', selectionData.name);
    genericUtils.setProperty(selectionData, 'flags.chris-premades.warGodsBlessing.identifier', identifier);
    effectUtils.addMacro(selectionData, 'midi.actor', ['warGodsBlessingCast']);
    if (identifier === 'shieldOfFaith') {
        let selectionWorkflow = await workflowUtils.syntheticItemDataRoll(selectionData, workflow.actor, workflow.targets.size ? Array.from(workflow.targets) : [workflow.token]);
        let effectData = {
            name: selection.name + ' ' + genericUtils.translate('CHRISPREMADES.Generic.Source'),
            img: selection.img,
            origin: workflow.item.uuid,
            duration: itemUtils.convertDuration(selection)
        };
        let sourceEffect = selection.effects.contents?.[0];
        if (!sourceEffect) return;
        let targetEffect = actorUtils.getEffects(selectionWorkflow.targets.first().actor).find(effect => effect.name === sourceEffect.name);
        if (!targetEffect) return;
        await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: targetEffect, interdependent: true, rules: genericUtils.getRules(workflow.item), macros: [
            {
                type: 'midi.actor',
                macros: ['warGodsBlessingCast']
            }
        ]});
    } else {
        //Finish this.
    }
}
async function castAgain({trigger, workflow}) {

}
export let warGodsBlessing = {
    name: 'War God\'s Blessing',
    version: '1.3.30',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};