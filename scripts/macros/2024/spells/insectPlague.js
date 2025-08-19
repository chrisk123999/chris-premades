import {activityUtils, combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../../utils.js';

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
                rules: 'modern',
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['insectPlagueTemplate']
                }
            }
        }
    });
}
async function enter({trigger: {entity: template, castData, token}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    if (!combatUtils.perTurnCheck(targetCombatant, 'insectPlague')) return;
    await combatUtils.setTurnCheck(targetCombatant, 'insectPlague');
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'insectPlagueDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [token], {atLevel: castData.castLevel});
}
async function endTurn({trigger: {entity: template, castData, token, previousRound, previousTurn}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    let turnToCheck = previousRound + '-' + previousTurn;
    let lastDamagedTurn = targetCombatant.flags['chris-premades']?.['insectPlague']?.turn;
    if (lastDamagedTurn === turnToCheck) return;
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'insectPlagueDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [token], {atLevel: castData.castLevel});
}
export let insectPlague = {
    name: 'Insect Plague',
    version: '1.3.7',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['insectPlague']
            }
        ]
    }
};
export let insectPlagueTemplate = {
    name: 'Insect Plague: Template',
    version: insectPlague.version,
    rules: insectPlague.rules,
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