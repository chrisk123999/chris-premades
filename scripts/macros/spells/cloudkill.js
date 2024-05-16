import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.setFlag('chris-premades', 'template', {
        'name': 'cloudkill',
        'castLevel': workflow.castData.castLevel,
        'saveDC': chris.getSpellDC(workflow.item),
        'macroName': 'cloudkill',
        'templateUuid': template.uuid,
        'turn': 'start',
        'ignoreMove': false
    });
    async function effectMacro() {
        await chrisPremades.macros.cloudkill.move(effect, token);
    }
    let effectData = {
        'label': 'Cloudkill',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 86400
        },
        'flags': {
            'effectmacro': {
                'onTurnStart': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'spell': {
                    'cloudkill': {
                        'templateUuid': template.uuid
                    }
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData, workflow.item);
}
async function trigger(token, trigger) {
    let template = await fromUuid(trigger.templateUuid);
    if (!template) return;
    if (chris.inCombat()) {
        let turn = game.combat.round + '-' + game.combat.turn;
        let lastTurn = template.flags['chris-premades']?.spell?.cloudkill?.[token.id]?.turn;
        if (turn === lastTurn) return;
        await template.setFlag('chris-premades', 'spell.cloudkill.' + token.id + '.turn', turn);
    }
    let originUuid = template.flags.dnd5e?.origin;
    if (!originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Cloudkill - Damage', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Cloudkill - Damage');
    featureData.system.save.dc = trigger.saveDC;
    featureData.system.damage.parts = [
        [
            trigger.castLevel + 'd8[' + translate.damageType('poison') + ']',
            'poison'
        ]
    ];
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
}
async function move(effect, token) {
    function getAllowedMoveLocation(casterToken, template, maxSquares) {
        for (let i = maxSquares; i > 0; i--) {
            let movePixels = i * canvas.grid.size;
            let ray = new Ray(casterToken.center, template.object.center);
            let newCenter = ray.project((ray.distance + movePixels)/ray.distance);
            let isAllowedLocation = canvas.effects.visibility.testVisibility({'x': newCenter.x, 'y': newCenter.y}, {'object': template.Object});
            if (isAllowedLocation) return newCenter;
        }
        return false;
    }
    let templateUuid = effect.flags['chris-premades']?.spell?.cloudkill?.templateUuid;
    if (!templateUuid) return;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    let newCenter = getAllowedMoveLocation(token, template, 2);
    if(!newCenter) {
        ui.notifications.info('No room to move cloudkill!');
        return;
    }
    newCenter = canvas.grid.getSnappedPosition(newCenter.x, newCenter.y, 1);
    await template.update({x: newCenter.x, y: newCenter.y});
}
export let cloudkill = {
    'item': item,
    'trigger': trigger,
    'move': move
};