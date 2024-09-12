import {compendiumUtils, constants, dialogUtils, errors, genericUtils, workflowUtils} from '../../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    if (workflow.item.type !== 'weapon');
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('piercing')) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.raceFeatureItems, 'Grung: Poison', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.PoisonousSkin.Poison'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [workflow.hitTargets.first()]);
}
export let poisonousSkin = {
    name: 'Poisonous Skin',
    version: '0.12.64',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};