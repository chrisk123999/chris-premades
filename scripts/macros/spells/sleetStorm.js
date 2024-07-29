import {actorUtils, combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let template = workflow.template;
    if (!template) return;
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name,
                    visibility: {
                        obscured: true
                    }
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['sleetStormArea']
                }
            },
            walledtemplates: {
                wallRestriction: 'move',
                wallsBlock: 'recurse'
            }
        }
    });
}
async function enterOrStart({trigger: {entity: template, castData, token}}) {
    let [targetCombatant ] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    if (!combatUtils.perTurnCheck(targetCombatant, 'sleetStorm')) return;
    await combatUtils.setTurnCheck(targetCombatant, 'sleetStorm');
    if (effectUtils.getConcentrationEffect(token.actor)) await actorUtils.doConcentrationCheck(token.actor, castData.saveDC);
    if (actorUtils.checkTrait(token.actor, 'ci', 'prone')) return;
    if (effectUtils.getEffectByStatusID(token.actor, 'prone')) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Sleet Storm: Prone', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.sleetStorm.prone', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let sourceActor = (await fromUuid(template.flags.dnd5e?.origin))?.parent ?? token.actor;
    await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}
export let sleetStorm = {
    name: 'Sleet Storm',
    version: '0.12.0',
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
export let sleetStormArea = {
    name: 'Sleet Storm: Area',
    version: sleetStorm.version,
    template: [
        {
            pass: 'enter',
            macro: enterOrStart,
            priority: 50
        },
        {
            pass: 'turnStart',
            macro: enterOrStart,
            priority: 50
        }
    ]
};