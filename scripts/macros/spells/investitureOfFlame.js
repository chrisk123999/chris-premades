import {activityUtils, combatUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
import {start as startAnim, end as endAnim} from './fireShield.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'investitureOfFlameFire', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 2,
                value: 'cold',
                priority: 20
            },
            {
                key: 'system.traits.di.value',
                mode: 2,
                value: 'fire',
                priority: 20
            },
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
        ],
        flags: {
            'chris-premades': {
                fireShield: {
                    selection: 'fire',
                    playAnimation,
                },
                macros: {
                    movement: [
                        'investitureOfFlameFlaming'
                    ],
                    combat: [
                        'investitureOfFlameFlaming'
                    ],
                    effect: [
                        'investitureOfFlameFlaming'
                    ]
                }
            },
        }
    };
    // TODO: Need to disable autoanims here? If so should we do for others?
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        identifier: 'investitureOfFlame', 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'investitureOfFlame', 
            activityIdentifier: 'investitureOfFlameFire'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['investitureOfFlameFire'],
            favorite: true
        }
    });
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
    await startAnim({
        trigger: {
            entity: effect
        }
    });
}
async function moveOrTurn({trigger: {entity: effect, castData, token, target}}) {
    let doDamage = false;
    if (!combatUtils.inCombat()) {
        doDamage = true;
    } else {
        let [targetCombatant] = game.combat.getCombatantsByToken(target.document);
        if (!targetCombatant) return;
        let lastTriggerTurn = targetCombatant.flags?.['chris-premades']?.investitureOfFlame?.[token.id]?.lastTriggerTurn;
        let prevTurn = game.combat['previous'].round + '-' + game.combat['previous'].turn;
        let currentTurn = game.combat['current'].round + '-' + game.combat['current'].turn;
        if (!lastTriggerTurn || ![prevTurn, currentTurn].includes(lastTriggerTurn)) {
            doDamage = true;
            await genericUtils.setFlag(targetCombatant, 'chris-premades', 'investitureOfFlame.' + token.id + '.lastTriggerTurn', currentTurn);
        }
    }
    if (!doDamage) return;
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(effect.origin), 'investitureOfFlameHeat', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [target]);
}
async function end({trigger}) {
    await endAnim({trigger});
}
async function early({dialog}) {
    dialog.configure = false;
}
export let investitureOfFlame = {
    name: 'Investiture of Flame',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['investitureOfFlame']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['investitureOfFlameFire']
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '4d8',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'fire',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let investitureOfFlameFlaming = {
    name: 'Investiture of Flame: Flaming',
    version: investitureOfFlame.version,
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'turnEndNear',
            macro: moveOrTurn,
            priority: 50,
            distance: 5,
            disposition: 'enemy'
        }
    ],
    movement: [
        {
            pass: 'movedNear',
            macro: moveOrTurn,
            priority: 50,
            distance: 5,
            disposition: 'enemy'
        }
    ]
};