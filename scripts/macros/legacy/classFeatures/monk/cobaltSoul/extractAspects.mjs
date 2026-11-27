import {actorUtils, dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const traits = [['dv', 'damageTypes'], ['dr', 'damageTypes'], ['di', 'damageTypes'], ['ci', 'conditionTypes']];
async function use({document: item, workflow}) {
    const target = workflow.targets.documents[0]?.actor;
    if (!target) return;
    if (!analyzed(target, item)) {
        await effectUtils.createEffects(target, [documentUtils.getBaseEffectData(item, {
            name: item.name,
            img: item.img,
            origin: item.uuid,
            identifier: 'extractAspectsAnalyzed'
        })]);
    }
    const content = traits.map(([key, config]) => {
        const label = CONFIG.DND5E.traits[key]?.labels?.title ?? key;
        const values = [...target.system.traits[key].value].map(value => CONFIG.DND5E[config][value]?.label ?? CONFIG.DND5E[config][value]?.name ?? value);
        return values.length ? '<b>' + _loc(label) + ':</b> ' + values.join(', ') : '';
    }).filter(Boolean).join('<br>');
    if (!content) return;
    await ChatMessage.implementation.create({speaker: ChatMessage.implementation.getSpeaker({actor: workflow.actor}), content: '<b>' + target.name + '</b><br>' + content, whisper: [game.user.id]});
}
function analyzed(actor, item) {
    return actorUtils.getEffects(actor).some(effect => documentUtils.getIdentifier(effect) === 'extractAspectsAnalyzed' && effect.origin === item.uuid);
}
async function missed({document: item, workflow}) {
    const owner = actorUtils.getFirstToken(item.actor);
    const attacker = workflow.token?.document;
    if (!owner || !attacker || !workflow.attackRoll || !workflow.targets.has(owner) || workflow.hitTargets.has(owner)) return;
    if (!workflow.actor || !analyzed(workflow.actor, item) || actorUtils.hasUsedReaction(item.actor) || item.actor.statuses.has('incapacitated')) return;
    const strike = actorUtils.getItemByIdentifier(item.actor, 'unarmed-strike');
    if (!strike) return;
    const reach = itemUtils.getRange(strike).reach || 5;
    if (!tokenUtils.isWithinDistance(owner, attacker, reach)) return;
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Legacy.ExtractAspects.Strike', {name: attacker.name}), {userId: queryUtils.firstOwner(item.actor, true)})) return;
    const reactionsUsed = () => item.actor.getFlag('midi-qol', 'actions')?.reactionsUsed ?? 0;
    const before = reactionsUsed();
    await workflowUtils.syntheticItemRoll(strike, [attacker]);
    if (reactionsUsed() === before) await actorUtils.setReactionUsed(item.actor);
}
async function rested({document: item}) {
    const scene = actorUtils.getFirstToken(item.actor)?.parent ?? canvas.scene;
    if (!scene) return;
    await Promise.all(effectUtils.getSceneEffects(scene, 'extractAspectsAnalyzed', {origin: item}).map(effect => documentUtils.deleteDocument(effect)));
}
export const extractAspects = {
    name: 'Extract Aspects',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'targetAttackRollComplete',
            macro: missed,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorShort',
            macro: rested,
            priority: 50
        },
        {
            pass: 'actorLong',
            macro: rested,
            priority: 50
        }
    ]
};
