import {actorUtils, dialogUtils, genericUtils, itemUtils, tokenUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    let checkSize = itemUtils.getConfig(workflow.item, 'checkSize');
    for (let target of workflow.hitTargets) {
        if (actorUtils.getSize(target.actor) > 3 && checkSize) break;
        let options = [
            [genericUtils.format('CHRISPREMADES.Distance.DistanceFeet', {distance: 0}), 0]
        ];
        let distance = tokenUtils.getDistance(workflow.token, target);
        if (distance <= genericUtils.handleMetric(5)) break;
        if (distance > genericUtils.handleMetric(5)) options.push([genericUtils.format('CHRISPREMADES.Distance.DistanceFeet', {distance: 5}), 5]);
        if (distance > genericUtils.handleMetric(10)) options.push([genericUtils.format('CHRISPREMADES.Distance.DistanceFeet', {distance: 10}), 10]);
        let selection = Number(await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.ThornWhip.Pull', options));
        if (!selection) return;
        await tokenUtils.pushToken(workflow.token, target, -selection);
    }
}
export let thornWhip = {
    name: 'Thorn Whip',
    version: '1.1.10',
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
            value: 'checkSize',
            label: 'CHRISPREMADES.Macros.ThornWhip.CheckSize',
            type: 'checkbox',
            default: true,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};