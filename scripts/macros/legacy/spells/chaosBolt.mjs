import {automationUtils, dialogUtils} from '../../../proxy.mjs';
import {applyDamageType} from '../../generic/selectDamageType.mjs';
import {bounce, playBolt} from '../../modern/spells/chromaticOrb.mjs';
function getD8s(workflow) {
    return workflow.damageRolls[0].dice[0].results.filter(result => result.active).slice(0, 2).map(result => result.result);
}
async function damage({document, workflow}) {
    if (!workflow.hitTargets.size) return;
    const damageTypes = automationUtils.getConfigValue(document, 'damageTypes').split(',').map(type => type.trim());
    const options = Array.from(new Set(getD8s(workflow).map(value => damageTypes[value - 1]).filter(Boolean)));
    if (!options.length) return;
    await applyDamageType(workflow, options.length > 1 ? await dialogUtils.selectDamageType(options, document.name, 'CHRISPREMADES.Generic.SelectDamageType') || options[0] : options[0]);
}
async function use({document, workflow, castData}) {
    const target = workflow.targets.first();
    if (!workflow.token || !target) return;
    const state = workflow.workflowOptions?.['chris-premades']?.chaosBolt;
    await playBolt(document, workflow, target, state);
    if (!workflow.hitTargets.has(target) || !workflow.damageRolls?.length) return;
    const [first, second] = getD8s(workflow);
    if (first !== second && !automationUtils.getConfigValue(document, 'alwaysBounce')) return;
    await bounce(document, target, {
        state,
        stateKey: 'chaosBolt',
        activityIdentifier: 'chaosBoltBounce',
        range: automationUtils.getConfigValue(document, 'range'),
        dialogText: 'CHRISPREMADES.Macros.Legacy.ChaosBolt.Bounce',
        castLevel: state?.castLevel ?? castData.castLevel
    });
}
export const chaosBolt = {
    name: 'Chaos Bolt',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {
            pass: 'itemDamageRoll',
            macro: damage,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        alwaysBounce: {
            label: 'CHRISPREMADES.Macros.Legacy.ChaosBolt.AlwaysBounce',
            type: 'checkbox',
            default: false,
            homebrew: true,
            category: 'homebrew'
        },
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            homebrew: true,
            category: 'homebrew'
        },
        damageTypes: {
            default: 'acid, cold, fire, force, lightning, poison, psychic, thunder',
            type: 'text',
            label: 'CHRISPREMADES.Config.DamageTypes',
            hint: 'CHRISPREMADES.Macros.Legacy.ChaosBolt.DamageTypesHint',
            homebrew: true,
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'chromaticOrb'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
