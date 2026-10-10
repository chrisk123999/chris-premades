import {actorUtils, automationUtils} from '../../../proxy.mjs';
import {playTargetAnimations} from '../../generic/spellAnimation.mjs';
async function attack({document, workflow}) {
    const armor = workflow.targets.first()?.actor?.system.attributes.ac.equippedArmor;
    if (!automationUtils.getConfigValue(document, 'metalArmor').includes(armor?.system.type.baseItem)) return;
    workflow.tracker.advantage.add('shocking-grasp', document.name);
}
function playAnimation({document, workflow}) {
    playTargetAnimations(workflow, automationUtils.getResolvedAnimation(document, 'animation'));
}
async function late({document, workflow}) {
    await Promise.all(Array.from(workflow.hitTargets, token => actorUtils.setReactionUsed(token.actor)));
    playAnimation({document, workflow});
}
export const shockingGrasp = {
    name: 'Shocking Grasp',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemAttackRollConfig',
            macro: attack,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        metalArmor: {
            default: ['breastplate', 'chainmail', 'chainshirt', 'halfplate', 'plate', 'ringmail', 'scalemail', 'splint'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Legacy.ShockingGrasp.MetalArmor',
            hint: 'CHRISPREMADES.Macros.Legacy.ShockingGrasp.MetalArmorHint',
            category: 'homebrew',
            homebrew: true,
            get options() { return Object.keys(CONFIG.DND5E.armorIds).map(value => ({value, label: dnd5e.documents.Trait.keyLabel('armor:' + value)})); }
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'shockingGrasp'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
