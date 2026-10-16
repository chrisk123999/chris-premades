import {actorUtils, documentUtils, effectUtils, genericUtils, Logging, rollUtils, summonUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function contest(workflow, target, targetAbilities) {
    return await rollUtils.contestedRoll({sourceToken: workflow.token.document, targetToken: target.document, sourceRollType: 'skill', targetRollType: 'skill', sourceAbilities: ['ath'], targetAbilities, message: true, flavor: workflow.item.name});
}
async function forceful({workflow}) {
    const target = workflow.targets.first();
    if (!target || !workflow.token || await contest(workflow, target, ['ath']) <= 0) return;
    const summoner = summonUtils.getSummonData(workflow.actor)?.ownerToken ?? workflow.token.document;
    const mod = actorUtils.getSavedCastData(workflow.actor)?.mod ?? 0;
    const distance = genericUtils.convertDistance(target.document.parent, 5 + 5 * mod);
    const from = summoner.getCenterPoint();
    const to = target.document.getCenterPoint();
    const ray = {angle: Math.atan2(to.y - from.y, to.x - from.x)};
    await Promise.all([target.document, workflow.token.document].map(token => tokenUtils.slideToken(token, {ray, distance})));
}
async function grasp({workflow}) {
    const target = workflow.targets.first();
    if (!target?.actor || !workflow.token) return;
    if (actorUtils.getSize(target.actor) > CONFIG.DND5E.actorSizes.huge.numerical) return Logging.addMacroWarning('CPR', 'bigbys-hand', 'CHRISPREMADES.Macros.Legacy.BigbysHand.Big', {notify: 'info'});
    if (await contest(workflow, target, ['ath', 'acr']) <= 0) return;
    await tokenUtils.grapple(workflow.token.document, target.document, {contest: false, checkSize: false});
}
async function interpose({workflow}) {
    const target = workflow.targets.first();
    if (!target?.actor) return;
    const previous = effectUtils.getSceneEffects(canvas.scene, 'bigbysHandInterposed', {origin: workflow.actor});
    await Promise.all(previous.map(effect => documentUtils.deleteDocument(effect)));
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        identifier: 'bigbysHandInterposed',
        macros: [{type: 'roll', macros: [{source: 'chris-premades', rules: '2014', identifier: 'bigbys-hand-interposed'}]}]
    });
    await effectUtils.createEffects(target.actor, [effectData]);
}
async function use({workflow}) {
    switch (workflow.activity.identifier) {
        case 'forceful-hand': return await forceful({workflow});
        case 'grasping-hand': return await grasp({workflow});
        case 'interposing-hand': return await interpose({workflow});
    }
}
async function crush({workflow}) {
    if (workflow.activity.identifier !== 'grasping-hand-crush' || !workflow.token) return;
    const target = tokenUtils.getGrappled(workflow.token.document)[0];
    if (target?.object) {
        await workflowUtils.updateTargets(workflow, [target.object]);
        return;
    }
    Logging.addMacroWarning('CPR', 'bigbys-hand', 'CHRISPREMADES.Macros.Legacy.BigbysHand.NoGrapple', {notify: 'info'});
    return true;
}
function getSummoner(effect) {
    const hand = fromUuidSync(effect.origin, {strict: false})?.actor;
    return hand ? summonUtils.getSummonData(hand)?.owner : undefined;
}
async function cover({document: effect, workflow}) {
    const target = workflow.targets.first()?.actor;
    if (!target || target !== getSummoner(effect)) return;
    const effectData = documentUtils.getBaseEffectData(null, {
        name: _loc('CHRISPREMADES.Macros.Legacy.BigbysHand.HalfCover'),
        img: 'icons/environment/settlement/fence-wooden-picket.webp',
        origin: effect.uuid,
        identifier: 'bigbysHandCover',
        duration: {value: 6, units: 'seconds'}
    });
    effectData.statuses = ['coverHalf'];
    await effectUtils.createEffects(target, [effectData]);
}
async function uncover({document: effect, workflow}) {
    const target = workflow.targets.first()?.actor;
    const cover = target ? documentUtils.getEffectByIdentifier(target, 'bigbysHandCover') : undefined;
    if (cover?.origin === effect.uuid) await documentUtils.deleteDocument(cover);
}
export const bigbysHand = {
    name: 'Bigby\'s Hand',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'itemPreItemRoll', macro: crush, priority: 50},
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ]
};
export const bigbysHandInterposed = {
    name: 'Bigby\'s Hand: Interposing',
    version: bigbysHand.version,
    rules: bigbysHand.rules,
    roll: [
        {pass: 'actorPreambleComplete', macro: cover, priority: 50},
        {pass: 'actorRollFinished', macro: uncover, priority: 50}
    ]
};
