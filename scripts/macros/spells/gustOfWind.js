import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
import {constants} from '../../constants.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let template = fromUuidSync(workflow.templateUuid);
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
    async function effectMacro() {
        await warpgate.revert(token.document, 'Gust of Wind');
    }
    let effectData = {
        'name': 'Gust of Wind',
        'icon': workflow.item.img,
        'transfer': false,
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
    }
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
    if (featureWorkflow.failedSaves.size) {
        let gustAngle = template.object.ray.angle;
        let queueSetup = await queue.setup(feature.uuid, 'gustOfWind', 450);
        if (!queueSetup) return;
        let distance = 15;
        let ray = Ray.fromAngle(token.object.center.x, token.object.center.y, gustAngle, canvas.dimensions.size);
        await chris.pushTokenAlongRay(token.object, ray, distance);
        queue.remove(feature.uuid);
    }
}

async function move({speaker, actor, token, character, item, args, scope, workflow}) {
    let template = fromUuidSync(args?.[0]?.concentrationData?.templates?.[0])?.object;
    if (!template) return;
    await workflow.actor.sheet.minimize();
    // Input location for getting new angle & direction
    let targetLocation = await warpgate.crosshairs.show();
    if (targetLocation.cancelled) {
        await workflow.actor.sheet.maximize();
        return;
    }
    // Current template location
    let oldTemplateLocation = {x: template.x, y: template.y};

    // Caster center (to rotate template about)
    let sourceCenter = workflow.token.center;

    // Current vector from token center to template (what we will be rotating about sourceCenter)
    let oldVector = {x: oldTemplateLocation.x - sourceCenter.x, y: oldTemplateLocation.y - sourceCenter.y};

    // New vector from input targetLocation, used only to find new angle
    let vector = {x: targetLocation.x - sourceCenter.x, y: targetLocation.y - sourceCenter.y};

    // Old rotation angle
    let oldAngle = Math.toDegrees(template.ray.angle);

    // New rotation angle (angle of a line drawn to some point at x,y from the positive x axis is arctan(y/x))
    let newAngle = Math.toDegrees(Math.atan(vector.y/vector.x));

    // Above calculation only applies to points with positive x, negative x means add/subtract 180 degrees
    if (vector.x < 0) newAngle += 180;

    // New template location (old location rotated about caster center):
    // x' = x*cos(angle) - y*sin(angle) + x_offset
    // y' = y*cos(angle) + x*sin(angle) + y_offset
    // angle here is the difference between new and old angles. x & y are from oldVector, x_offset & y_offset are the token's center.
    let newLocation = {
        x: Math.round((oldVector.x * Math.cos(Math.toRadians(newAngle - oldAngle))) - (oldVector.y * Math.sin(Math.toRadians(newAngle - oldAngle)))) + sourceCenter.x,
        y: Math.round((oldVector.y * Math.cos(Math.toRadians(newAngle - oldAngle))) + (oldVector.x * Math.sin(Math.toRadians(newAngle - oldAngle)))) + sourceCenter.y
    }

    tokenAttacher.detachElementFromToken(template, workflow.token, true);
    await template.rotate(newAngle);
    await template.document.update({x: newLocation.x, y: newLocation.y});
    await tokenAttacher.attachElementToToken(template, workflow.token, true);
    if (newLocation.x === oldTemplateLocation.x || newLocation.y === oldTemplateLocation.y) {
        await template.document.callMacro('whenMoved');
    }
}

export let gustOfWind = {
    'item': item,
    'move': move,
    'trigger': trigger
};