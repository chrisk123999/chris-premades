import {combatUtils, constants, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';

async function sourceAttack({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!effect) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'ancestralProtectors');
    if (!originItem) return;
    if (!combatUtils.perTurnCheck(originItem, 'ancestralProtectors', true, workflow.token.id)) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.AncestralProtectors.Target'),
        img: originItem.img,
        origin: originItem.uuid,
        duration: {
            seconds: 12
        },
        flags: {
            dae: {
                specialDuration: [
                    'turnStartSource'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['ancestralProtectorsTarget']);
    await effectUtils.createEffect(workflow.hitTargets.first().actor, effectData, {parentEntity: effect, identifier: 'ancestralProtectorsTarget'});
    await combatUtils.setTurnCheck(originItem, 'ancestralProtectors');
}
async function early({workflow}) {
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'ancestralProtectorsTarget');
    let origin = await fromUuid(effect?.origin);
    if (!origin) return;
    let originActorUuid = origin.actor.uuid;
    let targetActorUuid = workflow.targets.first().actor.uuid;
    if (originActorUuid === targetActorUuid) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('CHRISPREMADES.Generic.Disadvantage' + ': ' + origin.name));
}
async function late({workflow}) {
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    if (workflow.hitTargets.size !== 1) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'ancestralProtectorsTarget');
    let origin = await fromUuid(effect?.origin);
    if (!origin) return;
    let originActorUuid = origin.actor.uuid;
    let targetActorUuid = workflow.hitTargets.first().actor.uuid;
    if (originActorUuid === targetActorUuid) return;
    let effectData = {
        name: origin.name + ' Resistance',
        img: 'icons/magic/time/arrows-circling-green.webp',
        changes: [
            {
                key: 'system.traits.dr.all',
                value: 1,
                mode: 0,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            },
            dae: {
                specialDuration: [
                    'isDamaged'
                ]
            }
        }
    };
    await effectUtils.createEffect(workflow.hitTargets.first().actor, effectData, {identifier: 'ancestralProtectorsResistance'});
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'ancestralProtectors', true);
}
export let ancestralProtectors = {
    name: 'Ancestral Protectors',
    version: '0.12.20',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: sourceAttack,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ]
};
export let ancestralProtectorsTarget = {
    name: 'Ancestral Protectors: Target',
    verison: ancestralProtectors.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: late,
                priority: 50
            }
        ]
    }
};