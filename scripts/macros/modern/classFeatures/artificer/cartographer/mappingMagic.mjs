import {actorUtils, combatUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
import {getMap} from './adventurersAtlas.mjs';
async function portalJump({workflow}) {
    const identifier = workflow.activity.identifier;
    if (!['portal-jump', 'portal-jump-map-holder'].includes(identifier)) return;
    const token = workflow.token?.document;
    if (!token) return;
    const speed = workflow.actor.system.attributes.movement.max ?? 0;
    const warn = message => {
        Logging.addMacroWarning('CPR', 'mapping-magic', message, {notify: 'warn'});
        return true;
    };
    if (!speed) return warn('CHRISPREMADES.Macros.Modern.MappingMagic.NoSpeed');
    if (!combatUtils.isOwnTurn(token)) return warn('CHRISPREMADES.Macros.Modern.MappingMagic.NotTurn');
    if (token.inCombat && tokenUtils.movementSpent(token, true) < Math.floor(speed / 2)) return warn('CHRISPREMADES.Macros.Modern.MappingMagic.NoMovement');
    if (identifier !== 'portal-jump-map-holder') return;
    const atlas = actorUtils.getItemByIdentifier(workflow.actor, 'adventurers-atlas');
    const invalid = Array.from(workflow.targets).filter(target => target === workflow.token || !getMap(target.actor, atlas));
    if (invalid.length) await workflowUtils.removeTargets(workflow, invalid);
    if (!workflow.targets.size) return warn('CHRISPREMADES.Macros.Modern.MappingMagic.NoHolder');
}
export const mappingMagic = {
    name: 'Mapping Magic',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: portalJump,
            priority: 50
        }
    ]
};
