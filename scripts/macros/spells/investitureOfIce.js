import {chris} from '../../helperFunctions.js';
import {fireShield} from './fireShield.js';
export async function investitureOfIce({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    async function effectMacro() {
        await warpgate.revert(token.document, 'Investiture of Ice');
        let animation = chrisPremades.helpers.getConfiguration(origin, 'animation') ?? chrisPremades.helpers.jb2aCheck() === 'patreon';
        if (!animation) return;
        await Sequencer.EffectManager.endEffects({'name': 'Investiture of Ice', 'object': token});
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Investiture of Ice - Cone', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Investiture of Ice - Cone');
    featureData.system.save.dc = chris.getSpellDC(workflow.item);
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': {
                'baseLevel': 6,
                'castLevel': workflow.castData.castLevel,
                'school': 'trs'
            }
        }
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 600
        },
        'changes': [
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'fire',
                'priority': 20
            },
            {
                'key': 'system.traits.di.value',
                'mode': 0,
                'value': 'cold',
                'priority': 20
            }
        ],
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
            },
            'autoanimations': {
                'isEnabled': false,
                'version': 5
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Investiture of Ice',
        'description': 'Investiture of Ice'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    await MidiQOL.getConcentrationEffect(workflow.actor, workflow.item).addDependents(...[workflow.actor.effects.getName(workflow.item.name)]);
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? chris.jb2aCheck() === 'patreon';
    if (!animation) return;
    await fireShield.animation(workflow.token, 'cold', 'Investiture of Ice');
}