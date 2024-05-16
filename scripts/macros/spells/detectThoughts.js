import {chris} from '../../helperFunctions.js';
async function detectThoughtsProbeItem({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size === 1) return;
    let effect = await MidiQOL.getConcentrationEffect(workflow.actor, workflow.item.origin);
    if (!effect) return;
    await chris.removeEffect(effect);
}
async function detectThoughtsItem({speaker, actor, token, character, item, args, scope, workflow}) {
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Detect Thoughts - Probe Deeper', false);
    if (!featureData) return;
    featureData.system.save.dc = chris.getSpellDC(workflow.item);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Detect Thoughts - Probe Deeper');
    featureData.origin = workflow.item.uuid;
    async function effectMacro () {
        await warpgate.revert(token.document, 'Detect Thoughts - Probe Deeper');
    }
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [workflow.item.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': featureData.name,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    await MidiQOL.getConcentrationEffect(workflow.actor, workflow.item).addDependents([workflow.actor.effects.getName(workflow.item.name)]);
}
export let detectThoughts = {
    'item': detectThoughtsItem,
    'probe': detectThoughtsProbeItem
}