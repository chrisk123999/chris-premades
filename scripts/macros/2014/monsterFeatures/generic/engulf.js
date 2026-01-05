import {actorUtils, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'engulf');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let sizeLimit = Number(config.sizeLimit);
    let max = Number(config.max);
    let uuids = workflow.token.document.flags['chris-premades']?.engulf?.uuids ?? [];
    if (max && uuids.length >= max) return;
    for (let token of workflow.hitTargets) {
        if (max && uuids.length >= max) break;
        let effect = actorUtils.getEffects(token.actor).find(i => i.origin === sourceEffect.uuid);
        if (effect) continue;
        if (uuids.includes(token.document.uuid)) continue;
        if (sizeLimit != -1 && actorUtils.getSize(token.actor) > sizeLimit) continue;
        if (config.checkSaves && !workflow.failedSaves.has(token)) continue;
        if (config.centerToken) await genericUtils.update(token.document, {x: workflow.token.center.x - (token.w / 2), y: workflow.token.center.y - (token.h / 2)});
        uuids.push(token.document.uuid);
        genericUtils.setProperty(effectData, 'flags.chris-premades.engulf.parentUuid', workflow.token.document.uuid);
        effectUtils.addMacro(effectData, 'effect', ['engulfEffect']);
        await effectUtils.createEffect(token.actor, effectData);
    }
    await tokenUtils.attachToToken(workflow.token, uuids);
}
async function early({trigger, workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'engulf');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    if (sourceEffect.flags.dae?.dontApply) return;
    await genericUtils.setFlag(sourceEffect, 'dae', 'dontApply', true);
}
async function removed({trigger: {entity: effect, token}}) {
    if (!token) return;
    let parentUuid = effect.flags['chris-premades']?.engulf?.parentUuid;
    if (!parentUuid) return;
    let parentToken = await fromUuid(parentUuid);
    if (!parentToken) return;
    await tokenUtils.detachFromToken(parentToken.object, [token.document.uuid]);
}
export let engulf = {
    name: 'Engulf',
    translation: 'CHRISPREMADES.Macros.Engulf.Name',
    version: '1.4.13',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'activities',
            label: 'CHRISPREMADES.Config.Activities',
            type: 'activities',
            default: []
        },
        {
            value: 'checkSaves',
            label: 'CHRISPREMADES.Config.CheckSaves',
            type: 'checkbox',
            default: true
        },
        {
            value: 'max',
            label: 'CHRISPREMADES.Macros.Engulf.Max',
            type: 'text',
            default: '0'
        },
        {
            value: 'sizeLimit',
            label: 'CHRISPREMADES.Config.SizeLimit',
            type: 'select',
            default: -1,
            options: () => {return [{value: '-1', label: 'CHRISPREMADES.Generic.None'}, ...Object.values(CONFIG.DND5E.actorSizes).map(data => ({value: String(data.numerical), label: data.label}))];}
        },
        {
            value: 'centerToken',
            label: 'CHRISPREMADES.Macros.Engulf.Center',
            type: 'checkbox',
            default: true
        }
    ]
};
export let engulfEffect = {
    name: 'Engulf Effect',
    version: engulf.version,
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ]
};