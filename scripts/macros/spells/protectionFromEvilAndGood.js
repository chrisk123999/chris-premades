async function save({trigger}) {
    return {label: 'CHRISPREMADES.Macros.ProtectionFromEvilAndGood.Save', type: 'advantage'};
}
export let protectionFromEvilAndGood = {
    name: 'Protection from Evil and Good',
    version: '1.1.0',
    save: [
        {
            pass: 'context',
            macro: save,
            priority: 50
        }
    ]
};