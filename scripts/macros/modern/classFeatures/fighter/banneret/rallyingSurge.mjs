import {actorUtils, dialogUtils, queryUtils} from '../../../../../proxy.mjs';
import {offerAllyAttack} from '../../../../generic/allyAttack.mjs';
import {moveWithin} from '../../../../generic/moveTargets.mjs';
async function rally({workflow}) {
    const token = workflow.token?.document;
    const allies = workflow.targets.documents.filter(ally => ally !== token && ally.actor && !actorUtils.hasUsedReaction(ally.actor));
    for (const ally of allies) {
        const userId = queryUtils.firstOwner(ally.actor, true);
        const choice = await dialogUtils.buttonDialog(workflow.item.name, _loc('CHRISPREMADES.Macros.Modern.RallyingSurge.Choose', {name: ally.name}), [
            ['CHRISPREMADES.Macros.Modern.RallyingSurge.Attack', 'attack'],
            ['CHRISPREMADES.Macros.Modern.RallyingSurge.Move', 'move'],
            ['DND5E.None', false]
        ], {userId});
        if (!choice) continue;
        const acted = choice === 'attack' ? await offerAllyAttack(workflow.item.name, ally, {userId}) : await moveWithin(ally, 0.5);
        if (acted) await actorUtils.setReactionUsed(ally.actor);
    }
}
export const rallyingSurge = {
    name: 'Rallying Surge',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: rally,
            priority: 50
        }
    ]
};
