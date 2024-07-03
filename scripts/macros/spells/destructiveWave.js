import {animationUtils, dialogUtils, effectUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 86400
        },
        flags: {
            'chris-premades': {
                conditions: ['prone']
            }
        }
    };
    for (let target of workflow.failedSaves) {
        await effectUtils.createEffect(target.actor, effectData);
    }
}
async function damage({workflow}) {
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.macros.destructiveWave.select', [['DND5E.DamageRadiant', 'radiant'], ['DND5E.DamageNecrotic', 'necrotic']]);
    if (!damageType) damageType = 'radiant';
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let jb2a = animationUtils.jb2aCheck();
    if (playAnimation && jb2a) {
        let anim = 'jb2a.thunderwave.center.';
        if (jb2a === 'patreon') {
            anim += (damageType === 'radiant') ? 'orange' : 'dark_purple';
        } else {
            anim += 'blue';
        }
        new Sequence().effect().atLocation(workflow.token).file(anim).scale(2.2).playbackRate(0.5).play();
        await workflowUtils.bonusDamage(workflow, '5d6[' + damageType + ']', {damageType});
    }
}
export let destructiveWave = {
    name: 'Destructive Wave',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
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