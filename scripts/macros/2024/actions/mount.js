import {activityUtils, actorUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    if (workflow.targets.has(workflow.token)) return;
    let mounted = await tokenUtils.mountToken(workflow.token, workflow.targets.first(), {
        unhideActivities: [{
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['dismount', 'fallOff'],
            favorite: true
        }],
        vae: [{
            type: 'use',
            name: workflow.item.name,
            identifier: 'mount'
        }]
    });
    if (!mounted) genericUtils.notify('CHRISPREMADES.Macros.Mount.Rideable', 'warn', {localize: true});
}
async function remove({trigger: {entity: effect}}) {
    if (!game.modules.get('Rideable')?.active) return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    await game.Rideable.UnMount([token.document]);
}
async function dismount({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'mountedRider');
    if (!effect) return;
    await genericUtils.remove(effect);
}
async function fallOff({trigger, workflow}) {
    if (!workflow.failedSaves.size) return;
    await effectUtils.applyConditions(workflow.actor, ['prone']);
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'mountedRider');
    if (!effect) return;
    await genericUtils.remove(effect);
}
async function prone({trigger: {entity: effect, target, token}}) {
    if (!target.statuses.has('prone') || !token) return;
    let mount = itemUtils.getItemByIdentifier(effect.parent, 'mount');
    if (!mount) return;
    let activity = activityUtils.getActivityByIdentifier(mount, 'fallOff', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [token]);
}
async function proneHorse({trigger: {entity: effect, target}}) {
    if (!target.statuses.has('prone')) return;
    let tokenUuid = effect.flags['chris-premades']?.mount?.rider;
    if (!tokenUuid) return;
    let token = await fromUuid(tokenUuid);
    if (!token) return;
    let mount = itemUtils.getItemByIdentifier(token.actor, 'mount');
    if (!mount) return;
    let activity = activityUtils.getActivityByIdentifier(mount, 'fallOff', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [token.object]);
}
export let mount = {
    name: 'Mount',
    version: '1.3.156',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['mount']
            },
            {
                pass: 'rollFinished',
                macro: dismount,
                priority: 50,
                activities: ['dismount']
            },
            {
                pass: 'rollFinished',
                macro: fallOff,
                priority: 50,
                activities: ['fallOff']
            }
        ]
    }
};
export let mountedRider = {
    name: 'Mount (Rider)',
    version: mount.version,
    rules: mount.rules,
    effect: [
        {
            pass: 'deleted',
            macro: remove,
            priority: 50
        },
        {
            pass: 'actorCreated',
            macro: prone,
            priority: 50
        }
    ]
};
export let mountedTarget = {
    name: 'Mount (Target)',
    version: mount.version,
    rules: mount.rules,
    effect: [
        {
            pass: 'actorCreated',
            macro: proneHorse,
            priority: 50
        }
    ]
};