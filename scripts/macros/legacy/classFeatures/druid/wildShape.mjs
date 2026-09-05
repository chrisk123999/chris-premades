import {'wild-shape' as wildShapeAll} from '../../../all.mjs';
async function damaged({document: effect, workflow}) {
    const ditem = workflow.damageList.find(d => d.isHit && d.actorId === effect.parent.id);
    if (!ditem || ditem.newHP > 0) return;
    const overflow = ditem.damageDetail.reduce((acc, i) => acc + i.value, 0) - ditem.oldTempHP - ditem.oldHP;
    await wildShapeAll.revert(effect.parent, overflow);
}
export const wildShape = {
    name: wildShapeAll.name,
    version: wildShapeAll.version,
    rules: '2014',
    notes: 'For convenience in combat, this automation does not work exactly rules as written. Forms must be prepared in direct link profiles on the transform activity, or by rolling the "Learn Form" activity.\n\n' + wildShapeAll.notes,
    scales: [
        ...wildShapeAll.scales,
        {
            identifier: 'wild-shape-uses',
            classIdentifier: 'druid',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'wild-shape-uses',
                    type: 'number',
                    scale: {
                        2: {value: 2},
                        20: {value: 99}
                    }
                },
                value: {},
                title: 'Wild Shape'
            }
        }
    ]
};
export const wildShapeActive = {
    name: wildShapeAll.name,
    version: wildShapeAll.version,
    rules: wildShape.rules,
    roll: [
        {
            pass: 'targetOnHit',
            macro: damaged,
            priority: 200
        }
    ]
};
