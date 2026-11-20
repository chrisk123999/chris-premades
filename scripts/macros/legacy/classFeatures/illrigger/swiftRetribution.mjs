import {actorUtils, documentUtils} from '../../../../proxy.mjs';
import {getSeals} from './balefulInterdict.mjs';
async function attacked({document: item, workflow}) {
    if (!(workflow.AoO || workflow.workflowOptions?.['gambits-premades']?.opportunityAttack) || !item.system.uses.value || item.actor.statuses.has('incapacitated')) return;
    const interdict = actorUtils.getItemByIdentifier(item.actor, 'baleful-interdict');
    if (!interdict || !workflow.targets.documents.some(target => target.actor && getSeals(target.actor, interdict).length)) return;
    await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    await MidiQOL.removeReactionUsed(item.actor, true);
}
export const interdictBoonSwiftRetribution = {
    name: 'Interdict Boons: Swift Retribution',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: attacked,
            priority: 300
        }
    ]
};
