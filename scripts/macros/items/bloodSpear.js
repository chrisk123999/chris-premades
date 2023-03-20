import {chris} from '../../helperFunctions.js';
export async function bloodSpear({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let newHP = this.damageList[0].newHP;
    if (newHP != 0) return;
    let oldHP = this.damageList[0].oldHP;
    if (newHP === oldHP) return;
    let damageRoll = await new Roll('2d6[temphp]').roll({async: true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: this.item.name
    });
    await chris.applyDamage(this.token, damageRoll.total, 'temphp');
}