import {actorUtils, automationUtils, constants, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function attack({document, macroClass: {identifier, source}, workflow}) {
    const target = workflow.targets.tokens[0]?.document;
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
            !document.actor.statuses.has('incapacitated') &&
            !tokenUtils.isEnemy(self, workflow.token.document) &&
            tokenUtils.isEnemy(self, target) &&
            tokenUtils.isWithinDistance(self, target, config.range)
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
 * Grants advantage on attack rolls against a target that is near one of the attacker's allies. The owner gains it when
 * another creature hostile to the target is near the target and not incapacitated. Other attackers gain it when the
 * owner is hostile to their target and near it.
 */
export const packTactics = {
    rules: 'all',
    version: '2.1.11',
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
            hint: 'CHRISPREMADES.Macros.Generic.Common.AttackType.Hint',
            get options() { return constants.attackTypeOptions; }
        },
        range: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RiderNearbyRange.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PackTactics.Range.Hint'
        },
        benefit: {
            default: 'self',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PackTactics.Grant.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PackTactics.Grant.Hint',
            get options() { return [
                {label: 'CHRISPREMADES.Macros.Generic.PackTactics.Self', value: 'self'},
                {label: 'CHRISPREMADES.Macros.Generic.PackTactics.Allies', value: 'ally'},
                {label: 'CHRISPREMADES.Macros.Generic.PackTactics.SelfAndAllies', value: 'both'}
            ]; }
        }
    }
};
