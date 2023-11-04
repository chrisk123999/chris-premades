import {chris} from '../helperFunctions.js';
let autoRecs;
function sortAutoRec() {
    function addItems(setting) {
        game.settings.get('autoanimations', setting).filter(i => i.metaData?.name === '5e Animations').filter(i => i.primary?.sound?.enable || i.secondary?.sound?.enable).forEach(i => autoRecNames.add({'name': i.label.toLowerCase(), 'soundOne': i.primary.sound, 'soundTwo': i.secondary.sound}));
    }
    let settings = [
        'aaAutorec-melee',
        'aaAutorec-range',
        'aaAutorec-ontoken',
        'aaAutorec-templatefx',
        'aaAutorec-aura',
        'aaAutorec-preset',
        'aaAutorec-aefx'
    ];
    let autoRecNames = new Set();
    for (let setting of settings) addItems(setting);
    autoRecs = Array.from(autoRecNames);
}
function playItem(item) {
    let playSound = chris.getConfiguration(item, 'playSound') ?? true;
    if (!playSound) return;
    let chrisName = item.flags?.['chris-premades']?.info?.name ?? item.name;
    let specialSound = CONFIG.chrisPremades.automations[chrisName]?.specialSound ?? false;
    if (specialSound) return;
    let isEnabled = item.flags?.autoanimations?.isEnabled ?? true;
    let isCustomized = item.flags?.autoanimations?.isCustomized ?? false;
    let itemName = item.name.toLowerCase();
    let autoRec = autoRecs.find(i => i.name.includes(itemName));
    if (!autoRec) return;
    let soundOneEnabled = autoRec.soundOne?.enable ?? false;
    let soundTwoEnabled = autoRec.soundTwo?.enable ?? false;
    if (!soundOneEnabled && !soundTwoEnabled) return;
    if (isEnabled && !isCustomized && autoRec) return;
    function playItemSound(soundDetails) {
        new Sequence()
            .sound()
            .file(soundDetails.file)
            .startTime(soundDetails.startTime)
            .volume(soundDetails.volume)
            .delay(soundDetails.delay)
            .repeats(soundDetails.repeat, soundDetails.repeatDelay)
            .play();
    }
    if (soundOneEnabled) playItemSound(autoRec.soundOne);
    if (soundTwoEnabled) playItemSound(autoRec.soundTwo);
}
async function attackDone(workflow) {
    let playOnDamage = game.settings.get('autoanimations', 'playonDamage');
    if (!workflow.item || workflow.item?.hasAreaTarget || (workflow.item?.hasDamage && playOnDamage)) return;
    playItem(workflow.item);
}
async function damageDone(workflow) {
    let playOnDamage = game.settings.get('autoanimations', 'playonDamage');
    if (!workflow.item || workflow.item?.hasAreaTarget || (!playOnDamage && workflow.item?.hasAttack)) return;
    playItem(workflow.item);
}
async function rollDone(workflow) {
    if (!workflow.item || workflow.item?.hasAreaTarget || workflow.item?.hasAttack || workflow.item?.hasDamage) return;
    playItem(workflow.item);
}
export let dndAnimations = {
    'sortAutoRec': sortAutoRec,
    'attackDone': attackDone,
    'damageDone': damageDone,
    'rollDone': rollDone
}