import {actorUtils, Logging} from '../../../../../proxy.mjs';
async function preChecks({document: activity, macroClass: {identifier, source}}) {
    if (actorUtils.hasUsedReaction(activity.actor)) {
        Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Modern.BranchesOfTheTree.Reaction', {notify: 'warn'});
        return true;
    }
    if (!actorUtils.getEffectByIdentifier(activity.actor, 'rage')) {
        Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Modern.BranchesOfTheTree.Rage', {notify: 'warn'});
        return true;
    }
}
export const branchesOfTheTree = {
    name: 'Branches of the Tree',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preChecks,
            priority: 50
        }
    ]
};
