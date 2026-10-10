import {automationUtils, constants, genericUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function coverBonus({document, identifier, workflow}) {
    if (workflow.targets.size !== 1) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'ignoreCover', Object.keys(ignoreCover.genericConfig));
    if (!config.cover) return;
    if (config.attack && !workflowUtils.isAttackType(workflow, config.attack)) return;
    const cover = tokenUtils.checkCover(workflow.token.document, workflow.targets.first().document, {activity: workflow.activity});
    if (!cover) return;
    if (cover === 999 && config.cover == 999) {
        workflow.tracker.attribution.NOCOVER = {[identifier]: document.name};
        return genericUtils.setProperty(workflow.activity, 'midiProperties.ignoreFullCover', true);
    }
    if (cover <= config.cover) {
        workflow.tracker.attribution.NOCOVER = {[identifier]: document.name};
        await workflowUtils.bonusAttack(workflow, cover);
    }
}
export const ignoreCover = {
    rules: 'all',
    version: '2.0.5',
    category: 'utlity',
    generic: true,
    documents: ['activeeffect', 'item'],
    roll: [
        {
            pass: 'actorAttackRollBonuses',
            macro: coverBonus,
            priority: 250
        }
    ],
    genericConfig: {
        attack: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.AttackType.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.AttackTypeHint',
            get options() { return constants.attackTypeOptions; }
        },
        cover: {
            default: 2,
            type: 'select',
            category: 'behavior',
            label: 'DND5E.Cover',
            get options() { return constants.coverOptions; }
        }
    }
};
