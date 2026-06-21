import * as THREE from 'three';

export function createCradleArm() {
    const path = new THREE.CurvePath();
  
    path.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-2, -0.75, 0),
        new THREE.Vector3(-2, 1.6, 0)
      )
    );
  
    path.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-2, 1.6, 0),
        new THREE.Vector3(-2, 2, 0),
        new THREE.Vector3(-1.6, 2, 0)
      )
    );
  
    path.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-1.6, 2, 0),
        new THREE.Vector3(1.6, 2, 0)
      )
    );
  
    path.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(1.6, 2, 0),
        new THREE.Vector3(2, 2, 0),
        new THREE.Vector3(2, 1.6, 0)
      )
    );
  
    path.add(
      new THREE.LineCurve3(
        new THREE.Vector3(2, 1.6, 0),
        new THREE.Vector3(2, -0.75, 0)
      )
    );
  
    const geometry = new THREE.TubeGeometry(
      path,
      128,
      0.045,
      16,
      false
    );
  
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 1,
      roughness: 0.2
    });

    material.side = THREE.DoubleSide;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const standMaterial = new THREE.MeshStandardMaterial({
      color: 0x303030,
      metalness: 0.7,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });

    const standGeo = new THREE.BoxGeometry(5.5, 0.25, 1, 16, 16, 16);

    const stand = new THREE.Mesh(standGeo, standMaterial);

    stand.position.y = -0.75;

    stand.castShadow = true;
    stand.receiveShadow = true;

    const group = new THREE.Group();
  
    group.add(mesh);
    group.add(stand);

    return group
  }
