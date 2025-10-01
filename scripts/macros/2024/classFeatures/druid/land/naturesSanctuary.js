import {activityUtils, crosshairUtils, effectUtils, genericUtils, itemUtils, templateUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let template = workflow.template;
    if (!template) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        statuses: ['coverHalf'],
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 2,
                value: effectUtils.getEffectByIdentifier(workflow.actor, 'naturesWard')?.changes[1].value ?? 'fire',
                priority: 20
            }
        ]
    };
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name,
                },
                rules: 'modern',
                macros: {
                    template: ['naturesSanctuaryTemplate']
                },
                dispositionToAffect: workflow.token.document.disposition,
                effectData
            }
        }
    });
    await Promise.all(workflow.targets.map(i => effectUtils.createEffect(i.actor, effectData, {identifier: 'naturesSanctuary', parentEntity: template})));
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'naturesSanctuaryMove', {strict: true});
    if (!feature) return;
    let casterEffectData = {
        name: genericUtils.format('CHRISPREMADES.Auras.Source', {auraName: workflow.item.name}),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        flags: {
            'chris-premades': {
                naturesSanctuary: {
                    templateUuid: template.uuid
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, casterEffectData, {
        vae: [{
            type: 'use',
            name: feature.name,
            identifier: 'naturesSanctuary',
            activityIdentifier: 'naturesSanctuaryMove'
        }],
        identifier: 'naturesSanctuarySource',
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['naturesSanctuaryMove'],
            favorite: true
        }
    });
}
async function move({workflow}) {
    let newTemplate = workflow.template;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'naturesSanctuarySource');
    let template = await fromUuid(effect?.flags['chris-premades'].naturesSanctuary.templateUuid);
    if (!template) return;
    let preTokens = new Set(template.parent.tokens.filter(t => t.actor && effectUtils.getEffectByIdentifier(t.actor, 'naturesSanctuary')).map(t => t.object));
    let postTokens = workflow.targets;
    await genericUtils.update(template, {
        x: newTemplate.x ?? template.x,
        y: newTemplate.y ?? template.y
    });
    await genericUtils.remove(newTemplate);
    let toRemove = preTokens.difference(postTokens);
    let toAdd = postTokens.difference(preTokens);
    await Promise.all(toRemove.map(t => {
        let effect = effectUtils.getEffectByIdentifier(t.actor, 'naturesSanctuary');
        return effect ? genericUtils.remove(effect) : true;
    }));
    let effectData = template.getFlag('chris-premades', 'effectData');
    if (!effectData) return;
    await Promise.all(toAdd.map(t => {
        if (workflow.token.document.disposition !== t.document.disposition) return;
        return effectUtils.createEffect(t.actor, effectData, {identifier: 'naturesSanctuary', parentEntity: template});
    }));
}
async function enter({trigger: {entity: template, token}}) {
    if (token.document.disposition !== template.flags['chris-premades'].dispositionToAffect) return;
    if (effectUtils.getEffectByIdentifier(token.actor, 'naturesSanctuary')) return;
    let effectData = template.getFlag('chris-premades', 'effectData');
    if (!effectData) return;
    await effectUtils.createEffect(token.actor, effectData, {identifier: 'naturesSanctuary', parentEntity: template});
}
async function left({trigger: {token}}) {
    let effect = effectUtils.getEffectByIdentifier(token.actor, 'naturesSanctuary');
    if (effect) await genericUtils.remove(effect);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['naturesSanctuary'], 'wildShape');
}
export let naturesSanctuary = {
    name: 'Nature\'s Sanctuary',
    version: '1.3.83',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['naturesSanctuary']
            },
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50,
                activities: ['naturesSanctuaryMove']
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ],
};
export let naturesSanctuaryTemplate = {
    name: 'Nature\'s Sanctuary: Template',
    version: naturesSanctuary.version,
    rules: naturesSanctuary.rules,
    template: [
        {
            pass: 'enter',
            macro: enter,
            priority: 50
        },
        {
            pass: 'left',
            macro: left,
            priority: 50
        }
    ]
};