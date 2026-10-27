import {actorUtils, dialogUtils, Logging, queryUtils} from '../../../../../proxy.mjs';
async function oncePerRest({macroClass: {identifier, source}, workflow}) {
    if (workflow.targets.some(t => !t.actor || t.actor.flags[source]?.bolsteringMagic)) {
        Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Legacy.BolsteringMagic', {notify: true});
        return workflow.aborted = true;
    }
}
async function regainSlot({macroClass: {source, identifier}, workflow}) {
    const maxLevel = workflow.utilityRoll.total;
    for (const t of workflow.targets) {
        const choice = (await dialogUtils.selectSpellSlots(
            t.actor,
            workflow.item.name,
            _loc('CHRISPREMADES.Macros.Legacy.HarnessDivinePower.Prompt', {maxAmount: _loc('DND5E.spell')}),
            {maxAmount: 1, maxAmountMode: 'count', maxLevel, recover: true, userId: queryUtils.firstOwner(t.actor, true)}
        ))?.[0];
        if (!choice) {
            Logging.addMacroWarning(source, identifier, `Bolstering Magic was declined by the target, or they are not missing any eligible spells. (source) ${workflow.actor.uuid} (target) ${t.actor.uuid}`);
            continue;
        }
        await actorUtils.recoverSpellSlots(t.actor, choice.key);
    }
}
export const bolsteringMagic = {
    name: 'Bolstering Magic',
    version: '2.1.4',
    rules: '2014',
    roll: [
        {
            pass: 'activityTargeting',
            macro: oncePerRest,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: regainSlot,
            priority: 50
        }
    ]
};
