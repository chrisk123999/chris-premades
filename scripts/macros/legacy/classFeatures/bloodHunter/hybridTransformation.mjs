import {actorUtils, compendiumUtils, documentUtils, effectUtils, itemUtils, Logging, workflowUtils} from '../../../../proxy.mjs';
import {cpr} from '../../../../module.mjs';
async function use({workflow}) {
    if (workflow.activity.identifier === 'revert') {
        const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'hybridTransformation');
        if (effect) await documentUtils.deleteDocument(effect);
        return;
    }
    if (workflow.activity.identifier !== 'transform') return;
    const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'hybridTransformation');
    if (!effect) return;
    const heavy = workflow.actor.system.attributes.ac.equippedArmor?.system.type.value === 'heavy';
    const effectData = {system: {changes: effect.toObject().system.changes.filter(change => !heavy || change.key !== 'system.attributes.ac.bonus')}};
    effectUtils.pushImageChanges(effectData, workflow.item);
    await documentUtils.update(effect, {'system.changes': effectData.system.changes});
    const weapon = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, 'predatory-strike', {object: true});
    if (!weapon) return Logging.addMacroWarning('CPR', 'hybrid-transformation', 'Predatory Strike missing from pack.', {notify: 'warn'});
    await itemUtils.createItems(workflow.actor, [weapon], {favorite: true, parentEntity: effect});
}
async function turnStart({document: effect, token}) {
    const actor = token?.actor;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (!actor || !item) return;
    const advanced = actorUtils.getItemByIdentifier(actor, 'advanced-transformation');
    const regeneration = advanced && itemUtils.getActivityByIdentifier(advanced, 'regeneration');
    const before = actor.system.attributes.hp;
    if (regeneration && before.value >= 1 && before.value < before.max / 2) await workflowUtils.completeActivityUse(regeneration, [token]);
    const hp = actor.system.attributes.hp;
    if (hp.value >= hp.max / 2) return;
    const bloodlust = itemUtils.getActivityByIdentifier(item, 'bloodlust');
    if (!bloodlust) return;
    const concentrating = !!effectUtils.getConcentrationEffect(actor) || actorUtils.getEffectByIdentifier(actor, 'rage');
    const voraciousItem = actorUtils.getItemByIdentifier(actor, 'brand-of-the-voracious');
    const change = concentrating ? {key: 'flags.midi-qol.fail.ability.save.wis', type: 'custom', value: '1'} : voraciousItem ? {key: 'system.abilities.wis.save.roll.mode', type: 'add', value: '1'} : undefined;
    let temporary;
    if (change) [temporary] = await effectUtils.createEffects(actor, [{name: bloodlust.name, img: effect.img, system: {changes: [{...change, priority: 20}]}, flags: {cat: {noAnimation: true}, dae: {specialDuration: ['isSave']}}}]);
    await workflowUtils.completeActivityUse(bloodlust, [token]);
    if (temporary) await documentUtils.deleteDocument(temporary);
}
function voracious({document: effect, workflow}) {
    if (workflow.targets.count !== 1 || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!actorUtils.getItemByIdentifier(workflow.actor, 'brand-of-the-voracious')) return;
    const target = workflow.targets.documents[0].actor;
    if (documentUtils.getEffectByIdentifier(target, 'brandOfCastigation', {sourceActor: workflow.actor})) workflow.tracker.advantage.add('brand-of-the-voracious', effect.name);
}
export const hybridTransformation = {
    name: 'Hybrid Transformation',
    version: '2.1.11',
    rules: '2014',
    get config() {
        return effectUtils.getImageConfig();
    },
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
export const hybridTransformationForm = {
    name: 'Hybrid Transformation: Form',
    version: hybridTransformation.version,
    rules: '2014',
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 60
        }
    ],
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: voracious,
            priority: 50
        }
    ]
};
