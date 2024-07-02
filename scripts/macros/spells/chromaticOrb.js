import {animationUtils, dialogUtils, itemUtils} from '../../utils.js';

async function damage({workflow}) {
    if (!workflow.targets.size) return;
    let buttons = [
        ['DND5E.DamageAcid', 'acid', {image: 'icons/magic/acid/projectile-faceted-glob.webp'}],
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}],
        ['DND5E.DamageFire', 'fire', {image: 'icons/magic/fire/beam-jet-stream-embers.webp'}],
        ['DND5E.DamageLightning', 'lightning', {image: 'icons/magic/lightning/bolt-blue.webp'}],
        ['DND5E.DamagePoison', 'poison', {image: 'icons/magic/death/skull-poison-green.webp'}],
        ['DND5E.DamageThunder', 'thunder', {image: 'icons/magic/sonic/explosion-shock-wave-teal.webp'}],
    ];
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.macros.chromaticOrb.select', buttons);
    if (!damageType) return;
    workflow.damageRolls[0].options.type = damageType;
    for (let term of workflow.damageRolls[0].terms) {
        if (term.options.flavor === 'none') term.options.flavor = damageType;
    }
    workflow.defaultDamageType = damageType;
    await workflow.setDamageRolls(workflow.damageRolls);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let jb2a = animationUtils.jb2aCheck();
    if (playAnimation && jb2a) {
        let anim;
        if (jb2a === 'patreon') {
            anim = 'jb2a.guiding_bolt.02.';
            switch (damageType) {
                case 'acid':
                case 'poison':
                    anim += 'greenorange';
                    break;
                case 'cold':
                    anim += 'dark_bluewhite';
                    break;
                case 'lightning':
                    anim += 'yellow';
                    break;
                case 'thunder':
                    anim += 'blueyellow';
                    break;
                case 'fire':
                    anim += 'red';
                    break;
            }
        } else {
            anim = 'jb2a.guiding_bolt.01.blueyellow';
        }
        for (let target of workflow.targets) {
            animationUtils.simpleAttack(workflow.token, target, anim, {missed: !workflow.hitTargets.has(target)});
        }
    }
}
export let chromaticOrb = {
    name: 'Chromatic Orb',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
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