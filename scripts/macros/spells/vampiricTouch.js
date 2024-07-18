import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Vampiric Touch: Attack', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.vampiricTouch.attack', identifier: 'vampiricTouchAttack', castDataWorkflow: workflow});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let healingModifier = Number(itemUtils.getConfig(workflow.item, 'healingModifier'));
    featureData.system.damage.parts = [
        [
            workflow.castData.castLevel + formula + '[' + damageType + ']',
            damageType
        ]
    ];
    featureData.system.ability = workflow.item.system.ability;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: {
            seconds: workflow.item.system.duration.value * 60
        },
        origin: workflow.item.uuid
    };
    genericUtils.setProperty(featureData, 'flags.chris-premades.vampiricTouch.healingModifier', healingModifier);
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, identifier: 'vampiricTouch', strictlyInterdependent: true, vae: [{type: 'use', name: featureData.name, identifier: 'vampiricTouchAttack'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures')});
    if (game.user.targets.first() !=  workflow.token) {
        featureData.system.activation.type = 'special';
        await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [game.user.targets.first()]);
    }
}
async function attack({trigger, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let damage = workflowUtils.getTotalDamageOfType(workflow.damageDetail, workflow.targets.first().actor, workflow.item.system.damage.parts[0][1]);
    if (!damage) return;
    let healingModifier = workflow.item.flags['chris-premades']?.vampiricTouch?.healingModifier ?? 0.5;
    let healing = Math.floor(damage * healingModifier);
    await workflowUtils.applyDamage([workflow.token], healing, 'healing');
}
export let vampiricTouch = {
    name: 'Vampiric Touch',
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
            label: 'CHRISPREMADES.config.damageType',
            type: 'select',
            default: 'necrotic',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
            type: 'text',
            default: 'd6',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'healingModifier',
            label: 'CHRISPREMADES.macros.vampiricTouch.healingModifier',
            type: 'text',
            default: '0.5',
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let vampiricTouchAttack = {
    name: 'Vampiric Touch Attack',
    version: vampiricTouch.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: attack,
                priority: 450
            }
        ]
    }
};