import {activityUtils, actorUtils, animationUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (workflow.failedSaves.size) return;
    let sourceEffect = itemUtils.getEffectByIdentifier(workflow.item, 'hideEffect');
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.origin = sourceEffect.uuid;
    let macros;
    let supremeSneak = itemUtils.getItemByIdentifier(workflow.actor, 'supremeSneak');
    if (supremeSneak) {
        macros = [
            {
                type: 'combat',
                macros: ['hideEffect']
            }
        ];
    }
    await effectUtils.createEffect(workflow.actor, effectData, {rules: 'modern', macros});
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
async function checkRemove({trigger: {entity: effect}, workflow}) {
    if (!workflow.activity) return;
    switch (workflow.item.type) {
        case 'spell': {
            if (itemUtils.isSpellFeature(workflow.item) || activityUtils.isSpellActivity(workflow.activity)) return;
            if (!workflow.item.system.properties.has('vocal')) return;
            break;
        }
        default: {
            if (!workflowUtils.isAttackType(workflow, 'attack')) return;
            if (workflow['chris-premades']?.supremeSneak?.used) {
                await genericUtils.setFlag(effect, 'chris-premades', 'supremeSneak.check', true);
                return;
            }
        }
    }
    await genericUtils.remove(effect);
}
async function turn({trigger: {entity: effect}}) {
    if (!effect.flags['chris-premades']?.supremeSneak?.check) return;
    let supremeSneak = itemUtils.getItemByIdentifier(effect.parent, 'supremeSneak');
    if (!supremeSneak) return;
    let selection = await dialogUtils.confirm(supremeSneak.name, 'CHRISPREMADES.Macros.SupremeSneak.TurnEnd', {userId: socketUtils.firstOwner(effect, true)});
    if (selection) {
        await genericUtils.setFlag(effect, 'chris-premades', 'supremeSneak.check', false);
        return;
    }
    await genericUtils.remove(effect);
}
export let hide = {
    name: 'Hide',
    version: '1.3.61',
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
    ],
    combat: [
        {
            pass: 'everyTurn',
            macro: turn,
            priority: 50
        }
    ],
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: checkRemove,
                priority: 500
            }
        ]
    }
};