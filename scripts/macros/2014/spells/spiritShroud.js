import {combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let buttons = [
        ['DND5E.DamageNecrotic', 'necrotic', {image: 'icons/magic/unholy/orb-contained-pink.webp'}],
        ['DND5E.DamageRadiant', 'radiant', {image: 'icons/magic/light/projectile-beam-yellow.webp'}],
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}]
    ];
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', buttons);
    if (!damageType) damageType = 'necrotic';
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                spiritShroud: {
                    damageType,
                    castLevel: workflowUtils.getCastLevel(workflow)
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['spiritShroudShrouded']);
    effectUtils.addMacro(effectData, 'combat', ['spiritShroudShrouded']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'spiritShroud'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (tokenUtils.getDistance(workflow.token, workflow.hitTargets.first()) > 10) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritShroud');
    if (!effect) return;
    let diceNum = Math.floor((effect.flags['chris-premades'].spiritShroud.castLevel - 3) / 2) + 1;
    let damageType = effect.flags['chris-premades'].spiritShroud.damageType;
    await workflowUtils.bonusDamage(workflow, diceNum + 'd8', {damageType});
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.SpiritShroud.Hit'),
        img: effect.img,
        workflow: effect.origin,
        duration: {
            rounds: 1
        },
        changes: [
            {
                key: 'system.traits.di.value',
                value: 'healing',
                mode: 2,
                priority: 120
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'turnStartSource',
                    'combatEnd'
                ]
            }
        }
    };
    for (let target of workflow.hitTargets) {
        if (effectUtils.getEffectByIdentifier(target.actor, 'spiritShroudHid')) continue;
        await effectUtils.createEffect(target.actor, effectData, {identifier: 'spiritShroudHit'});
    }
}
async function everyTurn({trigger: {entity: effect, token, target}}) {
    if (!combatUtils.inCombat()) return;
    if (target.document.disposition === token.document.disposition) return;
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, 'spiritShroudSlow');
    if (targetEffect) await genericUtils.remove(targetEffect);
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.SpiritShroud.Slow'),
        img: effect.img,
        origin: effect.parent.uuid, // Not item uuid to prevent AA from killing the anim on the source actor(?)
        duration: {
            rounds: 1
        },
        changes: [
            {
                key: 'system.attributes.movement.all',
                mode: 0,
                value: genericUtils.handleMetric(-10),
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'turnStartSource',
                    'combatEnd'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await effectUtils.createEffect(target.actor, effectData, {parentEntity: effect, identifier: 'spiritShroudSlow'});
}
export let spiritShroud = {
    name: 'Spirit Shroud',
    version: '1.1.0',
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
export let spiritShroudShrouded = {
    name: 'Spirit Shroud: Shrouded',
    version: spiritShroud.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnStartNear',
            macro: everyTurn,
            priority: 50,
            distance: 10,
            disposition: 'enemy'
        }
    ]
};