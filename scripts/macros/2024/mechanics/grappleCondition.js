import {effectUtils} from '../../../utils.js';

async function attackConfig({trigger: {entity: effect}, workflow}) {
    let grappledBy = effectUtils.getAllEffectsByIdentifier(effect.parent, 'grappled')
        .map(e => e.flags['chris-premades']?.grapple?.tokenId)
        .filter(i => !!i);
    if (!grappledBy.length) return;
    if (workflow.targets.some(t => grappledBy.includes(t.id))) return;
    workflow.tracker.disadvantage.add(effect.name, effect.name);
}
export let grappleCondition = {
    name: 'Grapple Condition',
    verson: '1.5.14',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preAttackRollConfig',
                macro: attackConfig,
                priority: 60
            }
        ]
    }
};