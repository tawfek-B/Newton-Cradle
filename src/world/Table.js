import * as THREE from 'three';

export function createTable() {
    const manager = new THREE.LoadingManager();

    manager.onError = (url) => {
        console.error(`Error loading texture: ${url}`);
    };

    const loader = new THREE.TextureLoader(manager);

    let colorMap = loader.load('table/wood_table_worn_diff_1k.jpg');
    let normalMap = loader.load('table/wood_table_worn_nor_gl_1k.png');
    let armMap = loader.load('table/wood_table_worn_arm_1k.jpg');
    let displacementMap = loader.load('table/wood_table_worn_disp_1k.jpg');

    colorMap.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.NoColorSpace;
    armMap.colorSpace = THREE.NoColorSpace;
    displacementMap.colorSpace = THREE.NoColorSpace;

    const topMaterial = new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap: normalMap,
        aoMap: armMap,
        roughnessMap: armMap,
        metalnessMap: armMap,
        // displacementMap: displacementMap,

        roughness: 0.9,
        metalness: 0.05,
        // displacementScale: 0.05,
        normalScale: new THREE.Vector2(4, 4),
    });

    const edgeMaterial = new THREE.MeshStandardMaterial({
        map: colorMap.clone(),
        normalMap: normalMap.clone(),
        aoMap: armMap.clone(),
        roughnessMap: armMap.clone(),
        metalnessMap: armMap.clone(),
        // displacementMap: displacementMap.clone(),

        roughness: 0.9,
        metalness: 0.05,
        // displacementScale: 0.05,
        normalScale: new THREE.Vector2(4, 4),
    });

    edgeMaterial.map.wrapS = THREE.RepeatWrapping;
    edgeMaterial.map.wrapT = THREE.RepeatWrapping;
    edgeMaterial.map.repeat.set(24, 1);

    edgeMaterial.normalMap.wrapS = THREE.RepeatWrapping;
    edgeMaterial.normalMap.wrapT = THREE.RepeatWrapping;
    edgeMaterial.normalMap.repeat.set(24, 1);

    const topMaterials = [
        edgeMaterial, // right
        edgeMaterial, // left
        topMaterial,  // top
        topMaterial,  // bottom
        edgeMaterial, // front
        edgeMaterial, // back
    ];

    const top = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.2, 8, 64, 64, 64),
        topMaterials
    );

    top.receiveShadow = true;
    top.castShadow = true;

    if (top.geometry.attributes.uv && !top.geometry.attributes.uv2) {
        top.geometry.setAttribute(
            'uv2',
            top.geometry.attributes.uv.clone()
        );
    }

    top.position.y = -1;

    //legs
    colorMap = loader.load('table/wood_table_worn_diff_1k.jpg');
    normalMap = loader.load('table/wood_table_worn_nor_gl_1k.png');
    armMap = loader.load('table/wood_table_worn_arm_1k.jpg');
    displacementMap = loader.load('table/wood_table_worn_disp_1k.jpg');

    colorMap.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.NoColorSpace;
    armMap.colorSpace = THREE.NoColorSpace;

    const legMaterial = new THREE.MeshStandardMaterial({
        map: colorMap.clone(),
        normalMap: normalMap.clone(),
        aoMap: armMap.clone(),
        roughnessMap: armMap.clone(),
        metalnessMap: armMap.clone(),
        // displacementMap: displacementMap.clone(),

        roughness: 1,
        metalness: 0,
        // displacementScale: 0.05,
        normalScale: new THREE.Vector2(5, 5),
    });

    const legGeo = new THREE.BoxGeometry(
        0.3,
        20,
        0.3,
        120,
        2,
        80
    );

    const uv = legGeo.attributes.uv;

    for (let i = 0; i < uv.count; i++) {
        uv.setXY(
            i,
            uv.getX(i),
            uv.getY(i) * 4
        );
    }

    uv.needsUpdate = true;

    legMaterial.map.wrapS = THREE.RepeatWrapping;
    legMaterial.map.wrapT = THREE.RepeatWrapping;
    legMaterial.map.repeat.set(0.5, 10);

    legMaterial.normalMap.wrapS = THREE.RepeatWrapping;
    legMaterial.normalMap.wrapT = THREE.RepeatWrapping;
    legMaterial.normalMap.repeat.set(0.5, 10);

    const legs = [];
    const xOffset = 5.5;
    const zOffset = 3.5;
    const yOffset = -11;

    const positions = [
        [xOffset, yOffset, zOffset],
        [-xOffset, yOffset, zOffset],
        [xOffset, yOffset, -zOffset],
        [-xOffset, yOffset, -zOffset],
    ];

    for (const [x, y, z] of positions) {
        const leg = new THREE.Mesh(legGeo, legMaterial);
        leg.position.set(x, y, z);
        legs.push(leg);
    }

    const table = new THREE.Group();

    table.add(top);

    legs.forEach((leg) => {
        table.add(leg);
        leg.receiveShadow = true;
        leg.castShadow = true;
    });

    return table;
}