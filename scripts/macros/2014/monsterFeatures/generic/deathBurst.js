async function death({trigger}) {
    await trigger.entity.use();
}
export let deathBurst = {
    name: 'Death Burst',
    translation: 'CHRISPREMADES.Macros.DeathBurst.Name',
    version: '0.12.78',
    death: [
        {
            pass: 'dead',
            macro: death,
            priority: 50
        }
    ],
    isGenericFeature: true,
    genericConfig: []
};