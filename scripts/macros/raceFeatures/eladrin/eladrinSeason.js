import {chris} from '../../../helperFunctions.js';
export async function eladrinSeason({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    let currentSeason = workflow.actor.flags['chris-premades']?.race?.eladrin?.season;
    let generatedMenu = [];
    if (currentSeason != 'Autumn') generatedMenu.push(['🍂 Autumn', 'Autumn']);
    if (currentSeason != 'Winter') generatedMenu.push(['❄️ Winter', 'Winter']);
    if (currentSeason != 'Spring') generatedMenu.push(['🌼 Spring', 'Spring']);
    if (currentSeason != 'Summer') generatedMenu.push(['☀️ Summer', 'Summer']);
    let selection = await chris.dialog('What season?', generatedMenu);
    if (!selection) return;
    async function effectMacro () {
        await warpgate.revert(token.document, 'Eladrin Season');
    }
    let effectData = {
        'label': 'Eladrin Season',
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'flags.chris-premades.race.eladrin.season',
                'mode': 5,
                'value': selection,
                'priority': 20
            }
        ],
        'duration': {
            'seconds': 604800
        },
        'origin': workflow.item.uuid,
        'flags': {
            'dae': {
                'selfTarget': true,
                'selfTargetAlways': false,
                'stackable': 'none',
                'durationExpression': '',
                'macroRepeat': 'none',
                'specialDuration': [
                    'longRest'
                ],
                'transfer': true
            },
            'effectmacro': {
                'onDelete': {
                    'script': chrisPremades.helpers.functionToString(effectMacro)
                }
            }
        }
    }
    let hideIcon = chris.getConfiguration(workflow.item, 'showIcon');
    if (hideIcon) effectData.icon = '';
    let updates = {
        'embedded': {
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar-' + selection);
    let tokenImg = chris.getConfiguration(workflow.item, 'token-' + selection);
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    if (workflow.actor.system.details.level >= 3) {
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Race Feature Items', 'Fey Step (' + selection + ')', false);
        if (!featureData) return;
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Fey Step (' + selection + ')');
        featureData.system.save.dc = chris.getSpellDC(workflow.item);
        updates.embedded.Item = {
            [featureData.name]: featureData
        }
    }
    let options = {
        'permanent': false,
        'name': 'Eladrin Season',
        'description': 'Eladrin Season'
    };
    let effect = chris.findEffect(workflow.actor, 'Eladrin Season');
    if (effect)  await chris.removeEffect(effect);
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}