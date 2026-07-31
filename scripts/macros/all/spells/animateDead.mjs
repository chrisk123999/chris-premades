import {automationUtils, summonUtils, activityUtils, effectUtils, itemUtils, dialogUtils, documentUtils, genericUtils, actorUtils} from '../../../proxy.mjs';
async function early({document}) {
    const configVal = automationUtils.getConfigValue(document.item, 'summons');
    if (configVal.length) return;
    const skeletonName = _loc('CHRISPREMADES.Macros.All.AnimateDead.Skeleton');
    const zombieName = _loc('CHRISPREMADES.Macros.All.AnimateDead.Zombie');
    const skeleton = await automationUtils.getCompendiumDocumentByName(skeletonName, 'monster');
    const zombie = await automationUtils.getCompendiumDocumentByName(zombieName, 'monster');
    if (!skeleton || !zombie) {
        const notFound = !skeleton ? !zombie ? skeletonName + ' & ' + zombieName : skeletonName : zombieName;
        genericUtils.notify(_loc('CHRISPREMADES.Macros.All.AnimateDead.NotFound', {creature: notFound}), 'warning');
    }
    const newConfig = [];
    if (skeleton) newConfig.push({sourceActorUuid: skeleton.uuid, sourceActorName: skeleton.name, sourceActorImg: skeleton.img});
    if (zombie) newConfig.push({sourceActorUuid: zombie.uuid, sourceActorName: zombie.name, sourceActorImg: zombie.img});
    if (newConfig.length) await automationUtils.setConfigValue(document.item, 'summons', newConfig);
    document.item.flags.cat.config.summons = newConfig; // Setting the flag in memory because setFlag...doesn't?
}
async function use({document, workflow, castData}) {
    const summonsConfig = automationUtils.getConfigValue(document.item, 'summons');
    if (!summonsConfig.length) return;
    let maxSummons = automationUtils.getConfigValue(document.item, 'baseMaxSummons') + ((castData.castLevel - 3) * 2);
    let undeadThralls = actorUtils.getItemByIdentifier(document.actor, 'undead-thralls');
    if (undeadThralls) maxSummons += undeadThralls.system.charges.value;
    let summonsData = [];
    if (summonsConfig.length > 1) {
        let documents = await Promise.all(summonsConfig.map(async i => await fromUuid(i.sourceActorUuid)));
        let selection = await dialogUtils.selectDocumentDialog(
            'CHRISPREMADES.Macros.All.AnimateDead.SelectSummons.Title', 
            _loc('CHRISPREMADES.Macros.All.AnimateDead.SelectSummons.Content', {max: maxSummons}),
            documents,
            {max: maxSummons, displayTooltips: true}
        );
        if (selection.length) {
            selection.forEach(i => {
                let config = summonsConfig.find(j => j.sourceActorUuid === i.document.uuid);
                for (let k = 0; k < i.amount; k++) {
                    summonsData.push({actor: i.document, ...config});
                }
            });
        } else {
            let config = summonsConfig.find(i => i.sourceActorUuid === selection.uuid);
            summonsData.push({actor: selection.document, ...config});
        }
    } else {
        let actor = await fromUuid(summonsConfig[0].sourceActorUuid);
        for (let i = 0; i < maxSummons; i++) {
            summonsData.push({actor, ...summonsConfig[0]});
        }
    }
    if (!summonsData.length) return;
    const updates = {
        effects: [
            {
                name: _loc('CHRISPREMADES.Macros.All.AnimateDead.Controlled'),
                img: document.item.img,
                origin: document.uuid,
                duration: {
                    seconds: activityUtils.getDuration(document)
                },
                start: ActiveEffect.implementation.getEffectStart(),
                changes: [
                    {
                        key: 'token.disposition',
                        priority: 10,
                        type: 'override',
                        value: workflow.token.document.disposition
                    }
                ],
                flags: {
                    cat: {
                        identifier: 'animate-dead-controlled'
                    }
                }
            }
        ]
    };
    const summons = await Promise.all(summonsData.map(async summonData => {
        const {sourceActorUuid, name, avatarImg, tokenImg, animation, sounds, items, initiative} = summonData;
        const sourceActor = await fromUuid(sourceActorUuid);
        if (!sourceActor) return;
        return await summonUtils.createSummon(workflow.actor, sourceActor, {avatarImg, tokenImg, name, animation, sounds, sourceDocument: document, items, initiative, disposition: workflow.token.document.disposition * -1, updates});
        // need option in create summon to remove the actor when the summon dies.
    }));
    if (!summons.length) return;
    const otherActivities = ['animate-dead-place', 'animate-dead-recall', 'animate-dead-command', 'animate-dead-reassert'];
    await itemUtils.unhideActivities(document.item, otherActivities);
    if (workflow.token) await summonUtils.placeSummons(summons, document.range.value, {token: workflow.token.document});
    let effect = documentUtils.getEffectByIdentifier(document.actor, 'animate-dead-summoner');
    if (effect) return;
    let effectData = documentUtils.getEffectByIdentifier(document.item, 'animate-dead-summoner').toObject();
    genericUtils.setProperty(effectData, 'flags.cat.activityUuid', document.uuid);
    await effectUtils.createEffects(document.actor, [effectData], {rules: '2014'});
}
async function reassert({document}) {
    let summonActivity = itemUtils.getActivityByIdentifier(document.item, 'animate-dead-summon');
    if (!summonActivity) return;
    let summons = summonUtils.getSummonBySource(summonActivity);
    if (!summons.length) return;
    let maxReassert = automationUtils.getConfigValue(document.item, 'reassertMax');
    if (!maxReassert) return;
    let validSummons = summons.filter(i => documentUtils.getEffectByIdentifier(i.actor, 'animate-dead-controlled').duration.secondsRemaining < 86400).map(i => i.actor);
    let selectedSummons = [];
    if (validSummons.length > maxReassert) {
        let selection = await dialogUtils.selectDocumentDialog(
            'CHRISPREMADES.Macros.All.AnimateDead.SelectSummons.Title',
            _loc('CHRISPREMADES.Macros.All.AnimateDead.Reassert.Content', {max: maxReassert}),
            validSummons,
            {max: maxReassert, checkbox: true, labels: validSummons.reduce((acc, i) => {
                acc[i.id] = i.name + ' (' + _loc('CHRISPREMADES.Macros.All.AnimateDead.Reassert.Label', {time:documentUtils.getEffectByIdentifier(i, 'animate-dead-controlled').duration.secondsRemaining}) + ')';
                return acc;
            }, {})}
        );
        if (!selection.length) return;
        selectedSummons = selection.map(i => i.document);
    } else {
        selectedSummons = validSummons;
    }
    if (!selectedSummons.length) return;
    await Promise.all(selectedSummons.map(async i => {
        let effect = documentUtils.getEffectByIdentifier(i, 'animate-dead-controlled');
        if (!effect) return;
        await documentUtils.updateEmbeddedDocuments(i, 'ActiveEffect', [{_id: effect.id, 'start.time':  game.time.worldTime}]);
    }));
}
async function place({document, workflow}) {
    await summonUtils.placeAllSourceSummons(document, workflow.activity.range.value, {token: workflow.token.document});
}
async function recall({document, workflow}) {
    await summonUtils.recallAllSourceSummons(document);
}
async function summonDeleted({document, summon}) {
    const summons = summonUtils.getSummonBySource(document).filter(i => i !== summon);
    if (summons.length) return;
    const otherActivities = ['animate-dead-place', 'animate-dead-recall', 'animate-dead-command', 'animate-dead-reassert'];
    await itemUtils.rehideActivities(document.item, otherActivities);
    let effect = documentUtils.getEffectByIdentifier(document.actor, 'animate-dead-summoner');
    if (effect) await documentUtils.deleteDocument(effect);
}
async function effectDeleted({document}) {
    let sourceActivity = await effectUtils.getOriginActivity(document);
    let summons = summonUtils.getSummonBySource(sourceActivity);
    if (!summons.length) return;
    await Promise.all(summons.map(async i => await summonUtils.deleteSummon(i)));
}
const rules = 'all';
export const animateDeadSummon = {
    rules,
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: early,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    summon: [
        {
            pass: 'delete',
            macro: summonDeleted,
            priority: 50
        }
    ]
};
export const animateDeadPlace = {
    rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: place,
            priority: 50
        }
    ]
};
export const animateDeadRecall = {
    rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: recall,
            priority: 50
        }
    ]
};
export const animateDeadReassert = {
    rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: reassert,
            priority: 50
        }
    ]
};
export const animateDeadEffectDeleted = {
    rules,
    effect: [
        {
            pass: 'deleted',
            macro: effectDeleted,
            priority: 50
        }
    ]
};
export const animateDead = {
    version: '2.0.2',
    rules,
    config: {
        baseMaxSummons: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Config.BaseMaxSummons',
            category: 'homebrew'
        },
        reassertMax: {
            default: 4,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.AnimateDead.ReassertMax',
            category: 'homebrew'
        },
        summons: {
            default: [],
            type: 'selectSummons',
            label: 'CHRISPREMADES.Config.Summons',
            hint: '',
            category: 'summons'
        }
    }
};