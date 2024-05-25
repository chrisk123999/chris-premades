import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
import {constants} from '../../constants.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let template = await fromUuid(workflow.templateUuid);
    if (!template) return;
    await template.setFlag('chris-premades', 'template', {
        'name': 'gustOfWind',
        'castLevel': workflow.castData.castLevel,
        'saveDC': chris.getSpellDC(workflow.item),
        'macroName': 'gustOfWind',
        'templateUuid': template.uuid,
        'turn': 'start',
        'ignoreMove': true
    });
    await tokenAttacher.attachElementToToken(template, workflow.token, true);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Gust of Wind - Move');
    if (!featureData) return;
    setProperty(featureData, 'flags.chris-premades.spell.gustOfWind.templateUuid', template.uuid);
    async function effectMacro() {
        await warpgate.revert(token.document, 'Gust of Wind');
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premodes': {
                'spell': {
                    'gustOfWind': {
                        'templateUuid': template.uuid
                    }
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
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Gust of Wind',
        'description': 'Gust of Wind'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    await chris.addDependents(MidiQOL.getConcentrationEffect(workflow.actor, workflow.item), [workflow.actor.effects.getName(workflow.item.name)]);
}
async function trigger(token, trigger) {
    let template = await fromUuid(trigger.templateUuid);
    if (!template) return;
    let originUuid = template.flags.dnd5e?.origin;
    if (!originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Gust of Wind - Push', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Gust of Wind - Push');
    featureData.system.save.dc = trigger.saveDC;
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    let featureWorkflow = await MidiQOL.completeItemUse(feature, config, options);
    if (!featureWorkflow.failedSaves.size) return;
    let gustAngle = template.object.ray.angle;
    let queueSetup = await queue.setup(feature.uuid, 'gustOfWind', 450);
    if (!queueSetup) return;
    let ray = Ray.fromAngle(token.object.center.x, token.object.center.y, gustAngle, canvas.dimensions.size);
    await chris.pushTokenAlongRay(token.object, ray, 15);
    queue.remove(feature.uuid);
}
async function move({speaker, actor, token, character, item, args, scope, workflow}) {
    let templateUuid = workflow.item.flags['chris-premades']?.spell?.gustOfWind?.templateUuid;
    if (!templateUuid) return;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    let newTemplate = await fromUuid(workflow.templateUuid);
    if (!newTemplate) return;
    await tokenAttacher.detachElementFromToken(template.object, workflow.token, true);
    await warpgate.wait(100);
    let updates = {
        'x': newTemplate.x,
        'y': newTemplate.y,
        'direction': newTemplate.direction
    };
    await template.update(updates);
    await tokenAttacher.attachElementToToken(template, workflow.token, true);
    await newTemplate.delete();
}
export let gustOfWind = {
    'item': item,
    'move': move,
    'trigger': trigger
};