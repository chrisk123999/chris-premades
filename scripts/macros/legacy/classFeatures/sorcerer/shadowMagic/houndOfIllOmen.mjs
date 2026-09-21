import {activityUtils, automationUtils, constants, documentUtils, effectUtils, summonUtils, tokenUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    if (!workflow.targets.size) return;
    const [summonData] = automationUtils.getConfigValue(document, 'summons') ?? [];
    const sourceActor = summonData?.sourceActorUuid ? await fromUuid(summonData.sourceActorUuid) : undefined;
    if (!sourceActor) return;
    const targetToken = workflow.targets.first();
    const markerEffect = documentUtils.getEffectByIdentifier(targetToken.actor, 'houndOfIllOmenTarget');
    await Promise.all(summonUtils.getSummonBySource(document).map(async summon => await summonUtils.deleteSummon(summon)));
    const {name, avatarImg, tokenImg, animation, sounds, items, initiative} = summonData;
    const classIdentifier = automationUtils.getConfigValue(document, 'classIdentifier');
    const levels = workflow.actor.classes[classIdentifier]?.system.levels ?? 0;
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        name,
        size: 'med',
        duration: activityUtils.getDuration(workflow.activity),
        updates: {system: {details: {type: {value: 'monstrosity'}}, attributes: {hp: {temp: Math.floor(levels / 2)}}}},
        disposition: workflow.token.document.disposition,
        sourceDocument: document,
        dismissAtZero: true,
        parent: markerEffect,
        avatarImg,
        tokenImg,
        animation,
        sounds,
        items,
        initiative
    });
    if (!summon) return;
    await summonUtils.placeSummons([summon], workflow.activity.range.value, {token: workflow.token.document});
}
async function disadvantage({document, workflow}) {
    if (workflow.item.type !== 'spell' || !workflow.targets.size) return;
    const houndToken = summonUtils.getSummonBySource(document)[0]?.token;
    if (!houndToken) return;
    const distance = automationUtils.getConfigValue(document, 'distance');
    const marked = Array.from(workflow.targets, target => target.document ?? target).filter(targetToken => {
        if (!documentUtils.getEffectByIdentifier(targetToken.actor, 'houndOfIllOmenTarget')) return false;
        const range = tokenUtils.getDistance(houndToken, targetToken);
        return range >= 0 && range <= distance;
    });
    if (!marked.length) return;
    const effectData = documentUtils.getBaseEffectData(document, {
        name: _loc('CHRISPREMADES.Macros.Legacy.HoundOfIllOmen.Disadvantage'),
        img: constants.tempConditionIcon,
        origin: document.uuid,
        duration: {turns: 1},
        specialDuration: ['endOfWorkflow'],
        changes: [
            {key: 'flags.midi-qol.disadvantage.save.all', value: '1', mode: 5, priority: 120}
        ]
    });
    await Promise.all(marked.map(async targetToken => await effectUtils.createEffects(targetToken.actor, [effectData])));
}
export const houndOfIllOmen = {
    name: 'Hound of Ill Omen',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50},
        {pass: 'actorPreambleComplete', macro: disadvantage, priority: 100}
    ],
    config: {
        summons: {
            default: [
                {
                    sourceActorUuid: 'Compendium.dnd5e.monsters.Actor.EYiQZ3rFL25fEJY5',
                    name: 'Hound of Ill Omen',
                    animation: {source: 'chris-premades', identifier: 'shadowSummon'},
                    initiative: 'standard'
                }
            ],
            max: 1,
            type: 'selectSummons',
            label: 'CHRISPREMADES.Config.Summons',
            category: 'summons'
        },
        classIdentifier: {
            default: 'sorcerer',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        distance: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        }
    }
};
