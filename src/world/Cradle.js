import * as THREE from 'three';

export function createCradleArm() {
    const path = new THREE.CurvePath();
  
    path.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-2, -1, 0),
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
        new THREE.Vector3(2, -1, 0)
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
  
    return new THREE.Mesh(geometry, material);
  }
