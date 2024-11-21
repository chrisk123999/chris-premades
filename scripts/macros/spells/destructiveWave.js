import {animationUtils, dialogUtils, itemUtils, workflowUtils} from '../../utils.js';
import {proneOnFail} from '../generic/proneOnFail.js';

async function damage({workflow}) {
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', [['DND5E.DamageRadiant', 'radiant'], ['DND5E.DamageNecrotic', 'necrotic']]);
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
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            },
            proneOnFail.midi.item[0]
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