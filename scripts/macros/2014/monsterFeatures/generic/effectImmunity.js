import {actorUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'effectImmunity');
    let name = workflow.item.name + ' ' + genericUtils.translate('CHRISPREMADES.Macros.EffectImmunity.Immune');
    let savedTargets = workflow.targets.filter(i => !workflow.failedSaves.has(i));
    let seconds = isNaN(Number(config.duration)) ? 86400 : Number(config.duration);
    let effectData = {
        name: name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: seconds
        }
    };
    await Promise.all(savedTargets.map(async token => await effectUtils.createEffect(token.actor, effectData)));
    let firstEffectName = workflow.item.effects.contents.length ? workflow.item.effects.contents[0].name : workflow.item.name;
    await Promise.all(workflow.failedSaves.map(async token => {
        let effect = actorUtils.getEffects(token.actor).find(j => j.name === firstEffectName);
        if (!effect) return;
        let currentMacroList = genericUtils.getProperty(effect, 'flags.chris-premades.macros.effect') ?? [];
        await genericUtils.setFlag(effect, 'chris-premades', 'macros.effect', currentMacroList.concat(['effectImmunityRemove']));
    }));
}
async function early({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let name = workflow.item.name + ' ' + genericUtils.translate('CHRISPREMADES.Macros.EffectImmunity.Immune');
    let firstEffectName = workflow.item.effects.contents.length ? workflow.item.effects.contents[0].name : workflow.item.name;
    let validTargets = workflow.targets.filter(i => {
        let effects = actorUtils.getEffects(i.actor);
        if (effects.find(j => j.name === name)) return;
        if (effects.find(j => j.name === firstEffectName)) return;
        return true;
    });
    await workflowUtils.updateTargets(workflow, validTargets);
}
async function removed({trigger}) {
    //let expiryReason = trigger.options['expiry-reason'];
    await genericUtils.sleep(200);
    let effect = actorUtils.getEffects(trigger.entity.parent).find(i => i.name === trigger.entity.name && i.origin === trigger.entity.origin);
    if (effect) return;
    let origin = await effectUtils.getOriginItem(trigger.entity);
    if (!origin) return;
    let config = itemUtils.getGenericFeatureConfig(origin, 'effectImmunity');
    let name = origin.name +  ' ' + genericUtils.translate('CHRISPREMADES.Macros.EffectImmunity.Immune');
    let seconds = isNaN(Number(config.duration)) ? 86400 : Number(config.duration);
    let effectData = {
        name: name,
        img: origin.img,
        origin: origin.uuid,
        duration: {
            seconds: seconds
        }
    };
    await effectUtils.createEffect(trigger.entity.parent, effectData);
}
export let effectImmunity = {
    name: 'Effect Immunity',
    translation: 'CHRISPREMADES.Macros.EffectImmunity.Name',
    version: '1.0.44',
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
            value: 'duration',
            label: 'CHRISPREMADES.Config.DurationSeconds',
            type: 'number',
            default: 86400
        }
    ]
};
export let effectImmunityRemove = {
    name: 'Effect Immunity Remove',
    version: '1.0.44',
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ]
};