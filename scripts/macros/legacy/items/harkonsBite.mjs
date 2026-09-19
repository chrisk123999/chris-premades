import {actorUtils, automationUtils, documentUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
async function shapechange({document, workflow}) {
    if (!['hybrid', 'wolf'].includes(workflow.activity.identifier)) return;
    if (!itemUtils.getEquipmentState(document)) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'harkonsBiteEffect');
    if (!sourceEffect) return;
    const form = workflow.activity.identifier;
    const isHybrid = form === 'hybrid';
    const identifiers = isHybrid ? ['bite', 'claws', 'human'] : ['bite', 'human'];
    const activities = identifiers.map(identifier => itemUtils.getActivityByIdentifier(document, identifier)).filter(activity => activity);
    const vae = activities.map(activity => ({type: 'use', name: activity.name, identifier: 'harkons-bite', activityIdentifier: activity.identifier}));
    const config = automationUtils.getConfigValues(document, [form + 'AvatarImg', form + 'TokenImg', 'imgPriority', 'animation']);
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {
        activityUuid: workflow.activity.uuid,
        unhideActivities: identifiers,
        favoriteActivities: true,
        macros: [{type: 'effect', macros: [{source: 'chris-premades', rules: '2014', identifier: 'harkons-bite-effect'}]}],
        vae,
        avatarImg: config[form + 'AvatarImg'] || undefined,
        tokenImg: config[form + 'TokenImg'] || undefined,
        imgPriority: config.imgPriority,
        deleteAnimation: config.animation
    });
    if (!isHybrid) effectData.changes.push({key: 'system.attributes.movement.walk', mode: 4, value: '40', priority: 20});
    const createEffect = async () => {
        const existing = documentUtils.getEffectByIdentifier(workflow.actor, 'harkonsBiteEffect');
        if (existing) await documentUtils.deleteDocument(existing);
        if (!isHybrid) {
            const unequipped = [workflow.actor.system.attributes.ac.equippedArmor, workflow.actor.system.attributes.ac.equippedShield].filter(item => item);
            if (unequipped.length) {
                genericUtils.setProperty(effectData, 'flags.chris-premades.harkonsBite.unequipped', unequipped.map(item => item.id));
                await documentUtils.updateEmbeddedDocuments(workflow.actor, 'Item', unequipped.map(item => ({_id: item.id, 'system.equipped': false})));
            }
        }
        await effectUtils.createEffects(workflow.actor, [effectData]);
    };
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (!animation) return await createEffect();
    await animation.macros.transform(workflow.token.document, {...options, callback: createEffect});
}
async function human({workflow}) {
    if (workflow.activity.identifier !== 'human') return;
    const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'harkonsBiteEffect');
    if (effect) await documentUtils.deleteDocument(effect);
}
async function curse(document, workflow) {
    const target = workflow.hitTargets.first();
    if (actorUtils.typeOrRace(target.actor) !== 'humanoid') return;
    if (documentUtils.getEffectByIdentifier(target.actor, 'curseOfLycanthropy')) return;
    const activity = itemUtils.getActivityByIdentifier(document, 'humanoid');
    if (!activity) return;
    await workflowUtils.completeActivityUse(activity, Array.from(workflow.hitTargets, token => token.document ?? token));
}
async function bite({document, workflow}) {
    if (workflow.activity.identifier !== 'bite' || !workflow.hitTargets.size) return;
    await curse(document, workflow);
}
async function otherBite({document, workflow}) {
    if (!workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (workflow.item.system.type?.value !== 'natural') return;
    const biteActivity = itemUtils.getActivityByIdentifier(document, 'bite');
    if (biteActivity?.name !== workflow.activity.name) return;
    await curse(document, workflow);
}
async function reequip({document: effect}) {
    const ids = effect.flags['chris-premades']?.harkonsBite?.unequipped ?? [];
    const items = ids.map(id => effect.parent.items.get(id)).filter(item => item);
    if (!items.length) return;
    await documentUtils.updateEmbeddedDocuments(effect.parent, 'Item', items.map(item => ({_id: item.id, 'system.equipped': true})));
}
export const harkonsBiteEffect = {
    name: 'Harkon\'s Bite: Shapechanged',
    version: '2.0.0',
    rules: '2014',
    effect: [
        {pass: 'deleted', macro: reequip, priority: 50}
    ]
};
async function keenHearingAndSmell({document, skillId}) {
    if (skillId !== 'prc') return;
    if (!itemUtils.getEquipmentState(document)) return;
    return {
        label: 'CHRISPREMADES.Macros.Legacy.HarkonsBite.Keen',
        type: 'advantage'
    };
}
export const harkonsBite = {
    name: 'Harkon\'s Bite',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: shapechange, priority: 50},
        {pass: 'itemRollFinished', macro: human, priority: 50},
        {pass: 'itemRollFinished', macro: bite, priority: 50},
        {pass: 'actorRollFinished', macro: otherBite, priority: 50}
    ],
    skill: [
        {pass: 'actorContext', macro: keenHearingAndSmell, priority: 50}
    ],
    config: {
        imgPriority: {
            default: 50,
            type: 'number',
            label: 'CHRISPREMADES.Config.ImgPriority',
            category: 'visuals'
        },
        hybridTokenImg: {
            default: '',
            type: 'file',
            label: 'CHRISPREMADES.Macros.Legacy.HarkonsBite.HybridTokenImg',
            category: 'visuals'
        },
        hybridAvatarImg: {
            default: '',
            type: 'file',
            label: 'CHRISPREMADES.Macros.Legacy.HarkonsBite.HybridAvatarImg',
            category: 'visuals'
        },
        wolfTokenImg: {
            default: '',
            type: 'file',
            label: 'CHRISPREMADES.Macros.Legacy.HarkonsBite.WolfTokenImg',
            category: 'visuals'
        },
        wolfAvatarImg: {
            default: '',
            type: 'file',
            label: 'CHRISPREMADES.Macros.Legacy.HarkonsBite.WolfAvatarImg',
            category: 'visuals'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'moonFrenzy'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'visuals'
        }
    }
};
