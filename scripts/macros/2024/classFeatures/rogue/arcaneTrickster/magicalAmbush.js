import {combatUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function cast({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !workflow.item) return;
    if (!(itemUtils.isSpellFeature(workflow.item) || workflow.item.type === 'spell')) return;
    if (!workflow.actor.statuses.has('invisible')) return;
    if (!combatUtils.isOwnTurn(workflow.token)) return;
    await workflowUtils.syntheticItemRoll(item, []);
    let sourceEffect = item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = {seconds: 1};
    genericUtils.setProperty(effectData, 'flags.chris-premades.magicalAmbush.spellUuid', workflow.item.uuid);
    effectData.name += ': ' + workflow.item.name;
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
async function save({trigger: {sourceActor, config}}) {
    let effects = effectUtils.getAllEffectsByIdentifier(sourceActor, 'magicalAmbushEffect');
    for (let effect of effects) {
        let spellUuid = effect.flags['chris-premades']?.magicalAmbush?.spellUuid;
        if (!spellUuid) continue;
        if (spellUuid != config.midiOptions?.itemUuid) continue;
        config.disadvantage = true;
        break;
    }
}
export let magicalAmbush = {
    name: 'Magical Ambush',
    version: '1.3.50',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: cast,
                priority: 100
            }
        ]
    },
    save: [
        {
            pass: 'targetSituational',
            macro: save,
            priority: 50
        }
    ]
};