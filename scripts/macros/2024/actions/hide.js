import {actorUtils, animationUtils, effectUtils, itemUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    await workflow.actor.rollSkill({skill: 'ste'});
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation || animationUtils.jb2aCheck() != 'patreon') return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.smoke.puff.centered.dark_black')
            .atLocation(workflow.token)
            .scaleToObject(2.1 * workflow.token.document.texture.scaleX)
            .belowTokens()
            .opacity(0.5)
            .scaleIn(0, 500, {ease: 'easeOutCubic'})
            .randomRotation()
        .animation()
            .on(workflow.token)
            .delay(1000)
            .opacity(0)
        .effect()
            .copySprite(workflow.token)
            .atLocation(workflow.token)
            .scale(workflow.token.document.texture.scaleX)
            .tint('#6b6b6b')
            .fadeIn(1000)
            .duration(3000)
            .animateProperty('alphaFilter', 'alpha', {from: 0, to: -0.2, duration: 1000, delay: 1000})
        .animation()
            .on(workflow.token)
            .delay(3000)
            .opacity(0.8)
            .tint('#6b6b6b')
        .play();
    /* eslint-enable indent */
}
async function removed({trigger: {entity: effect}}) {
    let item = await effectUtils.getOriginItem(effect);
    if (!item) return;
    if (!itemUtils.getConfig(item, 'playAnimation') || animationUtils.jb2aCheck() != 'patreon') return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .file('jb2a.smoke.puff.centered.dark_black')
            .atLocation(token)
            .scaleToObject(2.1 * token.document.texture.scaleX)
            .belowTokens()
            .opacity(0.5)
            .scaleIn(0, 500, {ease: 'easeOutCubic'})
            .randomRotation()
        .animation()
            .on(token)
            .fadeIn(500)
            .opacity(1)
            .tint('')
        .play();
    /* eslint-enable indent */
}
export let hide = {
    name: 'Hide',
    version: '1.3.34',
    rules: 'modern',
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
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ],
    hasAnimation: true
};
export let hideEffect = {
    name: 'Hidden',
    version: hide.version,
    rules: hide.rules,
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ]
};