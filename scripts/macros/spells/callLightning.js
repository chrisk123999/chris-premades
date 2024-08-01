import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let storming = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.CallLightning.Storming');
    let castLevel = workflow.castData.castLevel;
    if (storming) castLevel += 1;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Storm Bolt', {getDescription: true, translate: 'CHRISPREMADES.Macros.CallLightning.StormBolt', identifier: 'stormBolt', castDataWorkflow: workflow, object: true});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    featureData.system.damage.parts = [
        [
            castLevel + 'd10[' + damageType + ']',
            damageType
        ]
    ];
    let duration = 60 * workflow.item.system.duration.value;
    featureData.system.save.dc = itemUtils.getSaveDC(workflow.item);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: duration
        },
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'callLightning', vae: [{type: 'use', name: featureData.name, identifier: 'stormBolt'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': duration});
    let stormBoltItem = itemUtils.getItemByIdentifer(workflow.actor, 'stormBolt');
    if (stormBoltItem) await workflowUtils.completeItemUse(stormBoltItem);
}
export let callLightning = {
    name: 'Call Lightning',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'lightning',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};