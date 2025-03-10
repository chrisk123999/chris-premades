import {Teleport} from '../../../../../lib/teleport.js';
import {animationUtils, constants, dialogUtils, genericUtils, itemUtils, tokenUtils} from '../../../../../utils.js';
async function veryEarly({activity, dialog, actor, config}) {
    if (activity.item.system.uses.value) return;
    dialog.configure = false;
    let sorceryPoints = itemUtils.getItemByIdentifier(actor, 'sorceryPoints');
    if (!sorceryPoints) return true;
    if (sorceryPoints.system.uses.value < 5) return true;
    let selection = await dialogUtils.confirm(activity.item.name, genericUtils.format('CHRISPREMADES.Macros.WarpingImplosion.Consume', {item: sorceryPoints.name}));
    if (!selection) return true;
    genericUtils.setProperty(config, 'consume.resources', false);
    await genericUtils.update(sorceryPoints, {'system.uses.spent': sorceryPoints.system.uses.spent + 5});
}
async function use({trigger, workflow}) {
    if (!workflow.token) return;
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    if (animationUtils.jb2aCheck() === 'free' && animation != 'none') animation = 'mistyStep';
    let tempToken = await workflow.token.actor.getTokenDocument({
        x: workflow.token.x,
        y: workflow.token.y,
        elevation: workflow.token.elevation,
        actorLink: false,
        hidden: true,
        delta: {ownership: workflow.token.actor.ownership}
    }, {parent: canvas.scene});
    await Teleport.target([workflow.token], workflow.token, {range: workflow.activity.range.value, animation});
    await Promise.all(workflow.failedSaves.map(token => {
        tokenUtils.pushToken(tempToken.object, token, Math.min(0, 5 - tokenUtils.getDistance(tempToken.object, token)));
    }));
}
export let warpingImplosion = {
    name: 'Warping Implosion',
    version: '1.2.17',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: veryEarly,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: constants.teleportOptions
        }
    ]
};