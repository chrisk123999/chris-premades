import {animationUtils, compendiumUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    if (!workflow.targets.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['sanctuarySafe']);
    for (let target of workflow.targets) {
        await effectUtils.createEffect(target.actor, effectData, {identifier: 'sanctuarySafe'});
    }
}
async function attack({workflow}) {
    if (workflow.item.flags['chris-premades']?.sanctuary?.ignore) return;
    let remove = false;
    remove ||= workflow.damageRoll && !(workflow.defaultDamageType === 'healing' || workflow.defaultDamageType === 'temphp');
    remove ||= constants.attacks.includes(workflow.item.system.actionType);
    remove ||= workflow.item.type === 'spell' && workflow.targets.find(i => i.document.disposition !== workflow.token.document.disposition);
    if (!remove) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'sanctuarySafe');
    if (effect) await genericUtils.remove(effect);
}
async function targeted({workflow}) {
    if (workflow.targets.size !== 1) return;
    let invalidTypes = Object.keys(CONFIG.DND5E.areaTargetTypes);
    if (invalidTypes.includes(workflow.item.system.target?.type)) return;
    let targetToken = workflow.targets.first();
    if (targetToken.document.disposition === workflow.token.document.disposition) return;
    let effect = effectUtils.getEffectByIdentifier(targetToken.actor, 'sanctuarySafe');
    let targetItem = await fromUuid(effect?.origin);
    if (!targetItem) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Sanctuary: Save', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Sanctuary.Save', flatDC: itemUtils.getSaveDC(targetItem)});
    genericUtils.setProperty(featureData, 'flags.chris-premades.sanctuary.ignore', true);
    let saveWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, targetToken.actor, [workflow.token]);
    if (!saveWorkflow.failedSaves.size) return;
    let playAnimation = itemUtils.getConfig(targetItem, 'playAnimation');
    if (playAnimation && animationUtils.jb2aCheck()) {
        new Sequence().effect().atLocation(targetToken).scaleToObject(1.25).fadeIn(500).fadeOut(500).playbackRate(2).file('jb2a.energy_field.02.above.blue').play();
    }
    ChatMessage.create({
        speaker: workflow.chatCard.speaker,
        content: genericUtils.translate('CHRISPREMADES.Macros.Sanctuary.Failed')
    });
    workflow.aborted = true;
}

export let sanctuary = {
    name: 'Sanctuary',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};
export let sanctuarySafe = {
    name: 'Sanctuary: Safe',
    version: sanctuary.version,
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: attack,
                priority: 50
            },
            {
                pass: 'targetPreItemRoll',
                macro: targeted,
                priority: 50
            }
        ]
    }
};