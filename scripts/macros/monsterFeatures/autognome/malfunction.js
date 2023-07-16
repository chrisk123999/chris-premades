import {chris} from '../../../helperFunctions.js';
export async function malfunction(workflow, targetToken) {
    if (workflow.hitTargets.size === 0) return;
    if (targetToken.actor.system.attributes.hp.value === 0) return;
    let appliedDamage = workflow.damageList.find(i => i.tokenId === targetToken.id)?.appliedDamage;
    if (!appliedDamage) return;
    if (appliedDamage < 15) return;
    let roll = await new Roll('1d20').roll({async: true});
    let total = roll.total;
    let effect = chris.findEffect(targetToken.actor, 'Malfunction');
    if (!effect) return;
    if (!effect.origin) return;
    let originItem = await fromUuidSync(effect.origin);
    if (!originItem) return;
    let flavor = originItem.name + ': ';
    let effectData = {
        'label': originItem.name,
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 86400
        }
    }
    let magicalDay = false;
    if (10 > total) {
        flavor += 'All Fine Here!'
    } else if (13 > total) {
        flavor += 'My Mind Is Going. I Can Feel It.';
        effectData.duration.seconds = 60;
        setProperty(effectData, 'changes', [{
            'key': 'macro.CE',
            'value': 'Incapacitated',
            'mode': 0,
            'priority': 20
        }]);
    } else if (15 >  total) {
        flavor += 'You\'ve Disarmed Me!';
    } else if (17 > total) {
        flavor += 'Who Turned Out the Lights?';
        setProperty(effectData, 'changes', [{
            'key': 'macro.CE',
            'value': 'Blinded',
            'mode': 0,
            'priority': 20
        },
        {
            'key': 'macro.CE',
            'value': 'Deafened',
            'mode': 0,
            'priority': 20
        }]);
    } else {
        flavor += 'Have a Magical Day!';
        magicalDay = true;
    }
    roll.toMessage({
        'rollMode': 'roll',
        'speaker': {'alias': name},
        'flavor': flavor
    });
    if (total < 11) return;
    await chris.createEffect(targetToken.actor, effectData);
    if (!magicalDay) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Monster Feature Items', 'Have a Magical Day!', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Have a Magical Day!');
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': targetToken.actor});
    await warpgate.wait(100);
    await feature.use();
    await chris.applyDamage(targetToken, '10000', 'none');
}