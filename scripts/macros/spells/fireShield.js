import {actorUtils, animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.macros.fireShield.select', [['CHRISPREMADES.macros.fireShield.warmShield', 'fire'], ['CHRISPREMADES.macros.fireShield.chillShield', 'cold']]);
    if (!selection) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Fire Shield: Dismiss', {getDescription: true, translate: 'CHRISPREMADES.macros.fireShield.dismiss', identifier: 'fireShieldDismiss', object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 0,
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
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'fireShield', vae: [{type: 'use', name: featureData.name, identifier: 'fireShieldDismiss'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures'), identifier: 'fireShield'});
}
async function hit({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    let targetToken = actorUtils.getFirstToken(effect.parent);
    if (!targetToken) return;
    let distance = tokenUtils.getDistance(workflow.token, targetToken);
    if (distance > 5) return;
    if (!constants.meleeAttacks.includes(workflow.item.system.actionType)) return;
    let shieldType = effect.flags['chris-premades']?.fireShield?.selection;
    if (!shieldType) return;
    let featureName = shieldType === 'fire' ? 'Warm Shield' : 'Chill Shield';
    let translation = shieldType === 'fire' ? 'CHRISPREMADES.macros.fireShield.warmShield' : 'CHRISPREMADES.macros.fireShield.chillShield';
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, featureName, {getDescription: true, translate: translation, object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    await workflowUtils.syntheticItemDataRoll(featureData, effect.parent, [workflow.token]);
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
export let fireShield = {
    name: 'Fire Shield',
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
            value: 'playAnimation',
            label: 'CHRISPREMADES.config.playAnimation',
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