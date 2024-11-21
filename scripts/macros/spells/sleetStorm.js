import {activityUtils, actorUtils, combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== genericUtils.getIdentifier(workflow.item)) return;
    let useRealDarkness = itemUtils.getConfig(workflow.item, 'useRealDarkness');
    let darknessAnimation = itemUtils.getConfig(workflow.item, 'darknessAnimation');
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
    if (useRealDarkness) {
        let [darknessSource] = await genericUtils.createEmbeddedDocuments(template.parent, 'AmbientLight', [{config: {negative: true, dim: template.distance, animation: {type: darknessAnimation}}, x: template.x, y: template.y}]);
        effectUtils.addDependent(template, [darknessSource]);
    }
}
async function enterOrStart({trigger: {entity: template, castData, token}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    if (!combatUtils.perTurnCheck(targetCombatant, 'sleetStorm')) return;
    await combatUtils.setTurnCheck(targetCombatant, 'sleetStorm');
    if (effectUtils.getConcentrationEffect(token.actor)) await actorUtils.doConcentrationCheck(token.actor, castData.saveDC);
    if (actorUtils.checkTrait(token.actor, 'ci', 'prone')) return;
    if (effectUtils.getEffectByStatusID(token.actor, 'prone')) return;
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'sleetStormProne', {strict: true});
    if (!feature) return;
    let saveWorkflow = await workflowUtils.syntheticActivityRoll(feature, [token]);
    if (saveWorkflow.failedSaves.size) await effectUtils.applyConditions(token.actor, ['prone']);
}
export let sleetStorm = {
    name: 'Sleet Storm',
    version: '1.1.0',
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
            value: 'useRealDarkness',
            label: 'CHRISPREMADES.Config.RealDarkness',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        },
        {
            value: 'darknessAnimation',
            label: 'CHRISPREMADES.Config.DarknessAnimation',
            type: 'select',
            default: null,
            options: [
                {
                    label: 'DND5E.None',
                    value: null
                },
                ...Object.entries(CONFIG.Canvas.darknessAnimations).flatMap(i => ({label: i[1].label, value: i[0]}))
            ],
            category: 'mechanics'
        }
    ]
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