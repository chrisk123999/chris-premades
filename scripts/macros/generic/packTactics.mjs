import {actorUtils, automationUtils, constants, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function attack({document, macroClass: {identifier, source}, workflow}) {
    const target = workflow.targets.first()?.document;
    if (!target) return;
    const config = automationUtils.getGenericConfigValues(document, source, identifier, Object.keys(packTactics.genericConfig));
    if (config.attackType && !workflowUtils.isAttackType(workflow, config.attackType)) return;
    const selfBenefit = () => {
        if (document.actor.uuid !== workflow.actor.uuid) return false;
        const near = tokenUtils.findNearby(target, config.range, {disposition: 'enemy', includeIncapacitated: false})
            .filter(t => t.uuid !== workflow.token.document.uuid);
        if (near.length) return true;
    };
    const allyBenefit = () => {
        if (document.actor.uuid === workflow.actor.uuid) return config.benefit === 'both' && selfBenefit();
        const self = actorUtils.getFirstToken(document.actor);
        if (
            self &&
            tokenUtils.isEnemy(self, target) &&
            tokenUtils.getDistance(self, target) <= config.range
        ) return true;
    };
    switch(config.benefit) {
        case 'ally':
        case 'both': if (allyBenefit()) break; return;
        case 'self': if (selfBenefit()) break; return;
    }
    workflow.tracker.advantage.add(identifier, document.name);
}
/**
 * Grants advantage on attack rolls if an ally is near the target.
 * - `attackType`: Limit this feature to the selected attack type.
 * - `range`: The target must be within this distance from any token that would grant advantage.
 * - `benefit`: Which character gains advantage when conditions are met.
 */
export const packTactics = {
    rules: 'all',
    version: '2.1.4',
    category: 'mechanics',
    generic: true,
    documents: ['activeeffect', 'activity', 'item'],
    roll: [
        {
            pass: 'sceneAttackRollConfig',
            macro: attack,
            priority: 600
        }
    ],
    genericConfig: {
        attackType: {
            default: 'attack',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.AttackType.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.AttackTypeHint',
            get options() { return constants.attackTypeOptions; }
        },
        range: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RiderNearbyRange'
        },
        benefit: {
            default: 'self',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PackTactics.Grant',
            hint: 'CHRISPREMADES.Macros.Generic.PackTactics.GrantHint',
            get options() { return [
                {label: 'CHRISPREMADES.Macros.Generic.Teleport.Self', value: 'self'},
                {label: 'CHRISPREMADES.Macros.Generic.PackTactics.Allies', value: 'ally'},
                {label: 'CHRISPREMADES.Macros.Generic.PackTactics.SelfAndAllies', value: 'both'}
            ]; }
        }
    }
};
