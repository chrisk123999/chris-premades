import {compendiumUtils, constants, effectUtils, errors, itemUtils, workflowUtils} from '../../../../utils.js';

async function save(actor) {
    let effect = effectUtils.getEffectByIdentifier(actor, 'holyNimbus');
    if (effect) return {label: 'CHRISPREMADES.Macros.HolyNimbus.Save', type: 'advantage'};
}
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: 60,
                priority: 20
            },
            {
                key: 'ATL.light.bright',
                mode: 4,
                value: 30,
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'combat', ['holyNimbusActive']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'holyNimbus'});
}
async function turnStart({trigger: {token, target}}) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Holy Nimbus: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.HolyNimbus.Damage'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    await workflowUtils.syntheticItemDataRoll(featureData, token.actor, [target]);
}
export let holyNimbus = {
    name: 'Holy Nimbus',
    version: '0.12.24',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    save: [
        {
            macro: save
        }
    ]
};
export let holyNimbusActive = {
    name: 'Holy Nimbus: Active',
    version: holyNimbus.version,
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            priority: 50,
            distance: 30,
            disposition: 'enemy'
        }
    ]
};