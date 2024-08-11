import {combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let template = workflow.template;
    if (!template) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name,
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['insectPlagueTemplate']
                },
                damageType: itemUtils.getConfig(workflow.item, 'damageType')
            }
        }
    });
}
async function enter({trigger: {entity: template, castData, token}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    if (!combatUtils.perTurnCheck(targetCombatant, 'insectPlague')) return;
    await combatUtils.setTurnCheck(targetCombatant, 'insectPlague');
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Insect Plague: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InsectPlague.Damage', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let damageType = template.flags['chris-premades'].damageType;
    featureData.system.damage.parts = [
        [
            (castData.castLevel - 1) + 'd10[' + damageType + ']',
            damageType
        ]
    ];
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}
async function endTurn({trigger: {entity: template, castData, token}}) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Insect Plague: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InsectPlague.Damage', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let damageType = template.flags['chris-premades'].damageType;
    featureData.system.damage.parts = [
        [
            (castData.castLevel - 1) + 'd10[' + damageType + ']',
            damageType
        ]
    ];
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}
export let insectPlague = {
    name: 'Insect Plague',
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
            default: 'piercing',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};
export let insectPlagueTemplate = {
    name: 'Insect Plague: Template',
    version: insectPlague.version,
    template: [
        {
            pass: 'turnEnd',
            macro: endTurn,
            priority: 50
        },
        {
            pass: 'enter',
            macro: enter,
            priority: 50
        }
    ]
};