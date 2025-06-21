import {activityUtils, actorUtils, animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let selection;
    if (activityIdentifier === 'fireShieldWarm') {
        selection = 'fire';
    } else if (activityIdentifier === 'fireShieldChill') {
        selection = 'cold';
    }
    if (!selection) return;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'fireShieldDismiss', {strict: true});
    if (!feature) return;
    await genericUtils.update(feature, {'img': workflow.activity.img});
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let effectData = {
        name: workflow.activity.name,
        img: workflow.activity.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 2,
                value: selection === 'fire' ? 'cold' : 'fire',
                priority: 20
            },
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: 20,
                priority: 20
            },
            {
                key: 'ATL.light.bright',
                mode: 4,
                value: 10,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                fireShield: {
                    selection,
                    playAnimation
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['fireShieldShielded']);
    effectUtils.addMacro(effectData, 'effect', ['fireShieldShielded']);
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'fireShield', 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'fireShield', 
            activityIdentifier: 'fireShieldDismiss'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['fireShieldDismiss'],
            favorite: true
        }
    });
}
async function dismiss({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'fireShield');
    if (effect) await genericUtils.remove(effect);
}
async function hit({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    let targetToken = actorUtils.getFirstToken(effect.parent);
    if (!targetToken) return;
    let distance = tokenUtils.getDistance(workflow.token, targetToken);
    if (distance > genericUtils.handleMetric(5)) return;
    if (!constants.meleeAttacks.includes(workflow.activity.actionType)) return;
    let shieldType = effect.flags['chris-premades']?.fireShield?.selection;
    if (!shieldType) return;
    let originItem = await effectUtils.getOriginItem(effect);
    let feature = activityUtils.getActivityByIdentifier(originItem, 'fireShieldDamage', {strict: true});
    if (!feature) return;
    let newDamagePart = feature.damage.parts[0] ?? {number: 2, denomination: 6};
    let activityData = activityUtils.withChangedDamage(feature, newDamagePart, [shieldType]);
    activityData.img = effect.img;
    await workflowUtils.syntheticActivityDataRoll(activityData, originItem, originItem.actor, [workflow.token]);
}
export async function start({trigger: {entity: effect}}) {
    let selection = effect.flags['chris-premades']?.fireShield?.selection;
    if (!selection) return;
    let playAnimation = effect.flags['chris-premades']?.fireShield?.playAnimation;
    if (!playAnimation || animationUtils.jb2aCheck() !== 'patreon') return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    let colors = {
        'fire': 'orange',
        'cold': 'blue'
    };
    let altColors = {
        'fire': 'yellow',
        'cold': 'blue'
    };
    //Animations by: eskiemoh
    new Sequence()
        .effect()
        .file('jb2a.impact.ground_crack.' + colors[selection] + '.01')
        .atLocation(token)
        .belowTokens()
        .scaleToObject(3)

        .effect()
        .file('jb2a.particles.outward.' + colors[selection] + '.01.03')
        .atLocation(token)
        .delay(200)
        .scaleIn(0.5, 250)
        .fadeOut(3000)
        .duration(15000)
        .scaleToObject(2.75)
        .playbackRate(1)
        .zIndex(2)

        .effect()
        .file('jb2a.energy_strands.in.' + altColors[selection] + '.01.2')
        .atLocation(token)
        .delay(200)
        .scaleIn(0.5, 250)
        .duration(2000)
        .belowTokens()
        .scaleToObject(2.75)
        .playbackRate(1)
        .zIndex(1)

        .effect()
        .file('jb2a.token_border.circle.spinning.' + colors[selection] + '.004')
        .atLocation(token)
        .scaleToObject(2.2)
        .playbackRate(1)
        .attachTo(token)
        .persist()
        .name('Fire Shield')

        .effect()
        .file('jb2a.shield_themed.below.fire.03.' + colors[selection])
        .atLocation(token)
        .delay(1000)
        .persist()
        .fadeIn(500)
        .attachTo(token)
        .fadeOut(200)
        .belowTokens()
        .scaleToObject(1.7)
        .playbackRate(1)
        .name('Fire Shield')

        .effect()
        .file('jb2a.shield_themed.above.fire.03.' + colors[selection])
        .atLocation(token)
        .persist()
        .fadeIn(3500)
        .attachTo(token)
        .fadeOut(200)
        .scaleToObject(1.7)
        .zIndex(0)
        .playbackRate(1)
        .name('Fire Shield')

        .play();
}
export async function end({trigger: {entity: effect}}) {
    let playAnimation = effect.flags['chris-premades']?.fireShield?.playAnimation;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!playAnimation || animationUtils.jb2aCheck() !== 'patreon' || !token) return;
    await Sequencer.EffectManager.endEffects({name: 'Fire Shield', object: token});
}
async function stop({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'fireShield');
    if (!effect) return;
    await genericUtils.remove(effect);
}
async function early({dialog}) {
    dialog.configure = false;
}
export let fireShield = {
    name: 'Fire Shield',
    version: '1.2.28',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['fireShieldWarm', 'fireShieldChill']
            },
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50,
                activities: ['fireShieldDismiss']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['fireShieldDismiss']
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
        }
    ]
};
export let fireShieldShielded = {
    name: 'Fire Shield: Shielded',
    version: fireShield.version,
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: hit,
                priority: 250
            }
        ]
    },
    effect: [
        {
            pass: 'created',
            macro: start,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};
export let fireShieldDismiss = {
    name: 'Fire Shield: Dismiss',
    version: fireShield.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: stop,
                priority: 50
            }
        ]
    }
};