import {chris} from '../../helperFunctions.js';
export async function potionOfGrowth({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let roll = await new Roll('1d4').roll({async: true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: 'Potion of Growth'
    });
    let changes =[
        {
            'key': 'system.bonuses.mwak.damage',
            'mode': 2,
            'priority': 20,
            'value': '+1d4'
        },
        {
            'key': 'system.bonuses.rwak.damage',
            'mode': 2,
            'priority': 20,
            'value': '+1d4'
        }
    ];
    let targetSize = targetActor.system.traits.size;
    let keyX;
    let keyY;
    let value;
    let size;
    switch (targetSize) {
        case 'tiny':
            keyX = 'ATL.texture.scaleX';
            keyY = 'ATL.texture.scaleY';
            value = '0.8';
            size = 'sm';
            break;
        case 'sm':
            keyX = 'ATL.texture.scaleX';
            keyY = 'ATL.texture.scaleY';
            value = '1';
            size = 'med';
            break;
        case 'med':
            size = 'lg'
            break;
        case 'lg':
            size = 'huge';
            break;
        case 'huge':
            size = 'grg';
            break;
    }
    if (!keyX) keyX = 'ATL.height';
    if (!keyY) keyY = 'ATL.width';
    if (!value) value = targetToken.document.height + 1;
    changes.push({
        'key': keyX,
        'mode': 5,
        'priority': 20,
        'value': value
    });
    changes.push({
        'key': keyY,
        'mode': 5,
        'priority': 20,
        'value': value
    });
    changes.push({
        'key': 'system.traits.size',
        'mode': 5,
        'priority': 20,
        'value': size
    });
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 3600 * roll.total
        },
        'changes': changes
    };
    await chris.createEffect(targetActor, effectData);
}