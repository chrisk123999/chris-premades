import {dialogUtils, documentUtils, effectUtils, genericUtils, queryUtils, rollUtils} from '../../../proxy.mjs';
async function use({document: item, workflow}) {
    const tokenDocument = workflow.token?.document;
    const combat = game.combat;
    if (!tokenDocument?.inCombat || !combat) return;
    const combatant = combat.getCombatantsByToken(tokenDocument)[0];
    const sourceEffect = item.effects.contents[0];
    if (!combatant || !sourceEffect) return;
    const turns = rollUtils.getRollsTotal(workflow.utilityRolls ?? []);
    const combatantData = Array.from({length: turns}, (_, index) => ({
        tokenId: tokenDocument.id,
        sceneId: tokenDocument.parent.id,
        actorId: workflow.actor.id,
        initiative: (combatant.initiative ?? 0) - (index + 1) * 0.01
    }));
    const combatants = await documentUtils.createEmbeddedDocuments(combat, 'Combatant', combatantData) ?? [];
    const effectData = documentUtils.getEffectData(item, sourceEffect.id);
    genericUtils.setProperty(effectData, 'flags.chris-premades.timeStop', {combatantUuids: combatants.map(i => i.uuid), tokenId: tokenDocument.id, origin: {x: tokenDocument.object.center.x, y: tokenDocument.object.center.y}});
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
async function deleted({document: effect}) {
    const combatantUuids = effect.flags['chris-premades']?.timeStop?.combatantUuids;
    if (!combatantUuids?.length || !game.combat) return;
    const ids = combatantUuids.map(uuid => fromUuidSync(uuid, {strict: false})).filter(combatant => combatant?.parent === game.combat).map(combatant => combatant.id);
    if (ids.length) await documentUtils.deleteEmbeddedDocuments(game.combat, 'Combatant', ids);
}
async function affectOther({document: effect, workflow}) {
    if (!workflow.targets.size || !Array.from(workflow.targets).some(token => token !== workflow.token)) return;
    if (!await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.Modern.TimeStop.Affect', {userId: queryUtils.gmID()})) return;
    await documentUtils.deleteDocument(effect);
}
async function moved({document: effect, token}) {
    const origin = effect.flags['chris-premades']?.timeStop?.origin;
    if (!origin || !token.object) return;
    if (canvas.grid.measurePath([origin, token.object.center]).distance > 1000) await documentUtils.deleteDocument(effect);
}
async function turnEnd({document: effect}) {
    const tokenId = effect.flags['chris-premades']?.timeStop?.tokenId;
    if (game.combat?.combatant?.tokenId !== tokenId) await documentUtils.deleteDocument(effect);
}
export const timeStop = {
    name: 'Time Stop',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ]
};
export const timeStopEffect = {
    name: 'Time Stop: Effect',
    version: timeStop.version,
    rules: timeStop.rules,
    roll: [
        {pass: 'actorRollFinished', macro: affectOther, priority: 200}
    ],
    effect: [
        {pass: 'deleted', macro: deleted, priority: 50}
    ],
    combat: [
        {pass: 'actorTurnEnd', macro: turnEnd, priority: 50}
    ],
    move: [
        {pass: 'actorMoved', macro: moved, priority: 50}
    ]
};
