import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
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

async function move({speaker, actor, token, character, item, args, scope, workflow}) {
    let template = workflow.token.attachedTemplates.find(currTemplate => currTemplate.document.uuid === args?.[0]?.concentrationData?.templates?.[0])
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

    await template.rotate(newAngle);
    await template.document.update({x: newLocation.x, y: newLocation.y});
    if (newLocation.x === oldTemplateLocation.x || newLocation.y === oldTemplateLocation.y) {
        await template.document.callMacro('whenMoved');
    }
}

async function push({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size === 0) return;
    let gustTemplate = fromUuidSync(workflow.actor.temporaryEffects.find(x => x.name === 'Gust of Wind')?.origin);
    if (!gustTemplate) return;
    let gustAngle = gustTemplate.object.ray.angle;
    let queueSetup = await queue.setup(workflow.item.uuid, 'gustOfWind', 450);
    if (!queueSetup) return;
    let targetToken = workflow.targets.first();
    let distance = 15;
    let ray = Ray.fromAngle(targetToken.center.x, targetToken.center.y, gustAngle, canvas.dimensions.size);
    await chris.pushTokenAlongRay(targetToken, ray, distance);
    queue.remove(workflow.item.uuid);
}

export let gustOfWind = {
    'item': item,
    'move': move,
    'push': push
};