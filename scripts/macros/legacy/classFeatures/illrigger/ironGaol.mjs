import {actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, queryUtils} from '../../../../proxy.mjs';
async function gaoled({document: item, workflow}) {
    for (const target of workflow.failedSaves.documents) {
        const effect = actorUtils.getEffects(target.actor).find(candidate => effectUtils.getOriginActivitySync(candidate)?.uuid === workflow.activity.uuid);
        if (!effect) continue;
        const permanent = actorUtils.getLevelOrCR(target.actor) <= automationUtils.getConfigValues(item, ['maxLevel']).maxLevel || await dialogUtils.confirm(workflow.item.name, _loc('CHRISPREMADES.Macros.Legacy.IronGaol.Native', {target: target.name}), {userId: queryUtils.gmID()});
        if (permanent) await documentUtils.update(effect, {'flags.cat.banish.permanent': true, 'system.changes': effect.system.changes.filter(change => change.key !== 'flags.midi-qol.OverTime')});
    }
}
export const interdictBoonIronGaol = {
    name: 'Interdict Boons: Iron Gaol',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: gaoled,
            priority: 50
        }
    ],
    config: {
        maxLevel: {
            default: 4,
            type: 'number',
            label: 'CHRISPREMADES.Config.MaxLevel',
            category: 'homebrew'
        }
    }
};
