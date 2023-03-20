import {chris} from '../../helperFunctions.js';
export async function potionOfDiminution({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    let targetActor = targetToken.actor;
    let roll = await new Roll('1d4').roll({async: true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: 'Potion of Diminution'
    });
    let changes = [
        {
            'key': 'system.bonuses.mwak.damage',
            'mode': 2,
            'priority': 20,
            'value': '-1d4'
        },
        {
            'key': 'system.bonuses.rwak.damage',
            'mode': 2,
            'priority': 20,
            'value': '-1d4'
        }
    ];
    let targetSize = targetActor.system.traits.size;
    let keyX;
    let keyY;
    let value;
    let size;
    switch (targetSize) {
        case 'sm':
            keyX = 'ATL.texture.scaleX';
            keyY = 'ATL.texture.scaleY';
            value = '0.5';
            size = 'tiny';
            break;
        case 'med':
            keyX = 'ATL.texture.scaleX';
            keyY = 'ATL.texture.scaleY';
            value = '0.8';
            size = 'sm';
            break;
        case 'lg':
            size = 'med';
            value = 1;
            break;
        case 'huge':
            size = 'lg';
            value = 2;
            break;
        case 'grg':
            size = 'huge';
            value = 3;
            break;
    }
    if (!keyX) keyX = 'ATL.height';
    if (!keyY) keyY = 'ATL.width';
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
        'label': this.item.name,
        'icon': this.item.img,
        'duration': {
            'seconds': 3600 * roll.total
        },
        'changes': changes
    };
    await chris.createEffect(targetActor, effectData);
}