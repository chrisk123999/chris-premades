import {actorUtils, automationUtils, constants, documentUtils, effectUtils} from '../../../proxy.mjs';
import {playTargetAnimations} from '../../generic/spellAnimation.mjs';
async function use({document, workflow}) {
    playTargetAnimations(workflow, automationUtils.getResolvedAnimation(document, 'animation'));
    const creatureTypes = automationUtils.getConfigValue(document, 'creatureTypes');
    const affectedTargets = Array.from(workflow.hitTargets).filter(token => token.actor && creatureTypes.includes(actorUtils.typeOrRace(token.actor)));
    if (!affectedTargets.length) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'chillTouchUndead');
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {activityUuid: workflow.activity.uuid});
    if (!effectData) return;
    await Promise.all(affectedTargets.map(token => effectUtils.createEffects(token.actor, [effectData])));
}
function attack({document, workflow}) {
    if (workflow.targets.size !== 1) return;
    const sourceActor = effectUtils.getOriginActivitySync(document)?.actor;
    if (!sourceActor || workflow.targets.first().actor !== sourceActor) return;
    workflow.tracker.disadvantage.add('chill-touch', document.name);
}
export const chillTouch = {
    name: 'Chill Touch',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        creatureTypes: {
            default: ['undead'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            category: 'homebrew',
            get options() { return constants.creatureTypeOptions; }
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'castBeam'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
export const chillTouchUndead = {
    name: 'Chill Touch: Undead',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        }
    ]
};
