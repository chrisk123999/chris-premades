import {actorUtils, animationUtils, automationUtils, rollUtils, workflowUtils} from '../../../../proxy.mjs';
// TODO selectAnimation config input shows up in the catkit, but choices are saved as if on a generic feature
//      this prevents fetching animation settings with helpers
async function checkCR({workflow}) {
    if (!workflow.targets.size) return;
    const config = automationUtils.getConfigValues(workflow.item, ['animation', 'scaleFormula']);
    // const animation = automationUtils.getResolvedAnimation(workflow.item, 'animation', config.animation);
    // const playAnimation = animation && animationUtils.sequencerCheck() && animationUtils.jb2aCheck();
    const cr = (await rollUtils.rollDice(config.scaleFormula || '0', {document: workflow.activity}))?.total ?? 0;
    const targets = [];
    for (const t of workflow.targets) {
        if (!t.actor) continue;
        if (actorUtils.getCR(t.actor) > cr) continue;
        targets.push(t.document);
        // if (playAnimation) animation.macros.play(t.document/*, {color}*/);
    }
    if (!targets.length) return true;
    await workflowUtils.updateTargets(workflow, targets);
}
export const destroyUndead = {
    name: 'Destroy Undead',
    version: '2.0.3',
    rules: '2014',
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: checkCR,
            priority: 50
        }
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'smite'
            },
            type: 'selectAnimation',
            inputs: ['targetToken'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'visuals'
        },
        scaleFormula: {
            default: '@scale.cleric.destroy-undead',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Legacy.DestroyUndead',
            category: 'behavior'
        },
        classIdentifier: {
            default: 'cleric',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'destroy-undead',
            classIdentifier: 'cleric',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'destroy-undead',
                    type: 'number',
                    scale: {
                        5: {value: 0.5},
                        8: {value: 1},
                        11: {value: 2},
                        14: {value: 3},
                        17: {value: 4}
                    }
                },
                value: {},
                title: 'Destroy Undead'
            }
        }
    ]
};
