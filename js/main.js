// just makes my IDE happy
if (!THREE) {
    let THREE = {};
    console.error('THREE is not loaded');
}

let Quaternia;
(Quaternia = function () {
    "use strict";

    const PLANET_RADIUS = 10;
    const PLANET_SEGMENTS = 64;
    const SKY_RADIUS = 150;
    const GLOWY_NUM = 500;

    // view
    let viewWidth = window.innerWidth;
    let viewHeight = window.innerHeight;
    let camOpts = {
        fov: 45,
        aspect: viewWidth / viewHeight,
        near: 0.1,
        far: 2000
    };

    // scene
    let scene = new THREE.Scene();
    let renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    renderer.setSize(viewWidth, viewHeight);

    // add canvas to dom
    document.getElementById('q_planet').appendChild(renderer.domElement);

    // loaders
    let textureLoader = new THREE.TextureLoader();
    let colladaLoader = new THREE.ColladaLoader();

    // app specific
    let playerGroup, playerAxis;
    let key_events = new PlayerActionListener(document);
    key_events.actions.chaseCameraOn = true;

    // cameras
    let overheadCamera;
    let chaseCamera;

    // timing
    let clock = new THREE.Clock();

    let loadCameras = function () {
        overheadCamera = new THREE.PerspectiveCamera(camOpts.fov, camOpts.aspect, camOpts.near, camOpts.far);
        scene.add(overheadCamera);
        chaseCamera = new THREE.PerspectiveCamera(camOpts.fov, camOpts.aspect, camOpts.near, camOpts.far);
        scene.add(chaseCamera);
        //let helper = new THREE.CameraHelper(chaseCamera);
        //scene.add(helper);
    };

    let loadLighting = function () {
        // ambient
        let ambLight = new THREE.AmbientLight("#d8e7e8");
        scene.add(ambLight);
        // directional
        let directionalLight = new THREE.DirectionalLight(0x772829, 0.75);
        directionalLight.position.set(5, 1, 5);
        scene.add(directionalLight);
    };

    let loadSkyGlowies = function () {
        let particleTexture = textureLoader.load('assets/textures/spark.png');
        let particleGroup = new THREE.Object3D();
        // standard random range thing
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        // build however many
        for (let i = 0; i < GLOWY_NUM; i++)
        {
            let spriteMaterial = new THREE.SpriteMaterial({map: particleTexture, color: 0xffffff});
            let sprite = new THREE.Sprite(spriteMaterial);
            let spriteSize = Math.floor(Math.random() * (8 - 1 + 1)) + 1;
            // scale and position
            sprite.scale.set(spriteSize, spriteSize, 1.0);
            sprite.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            sprite.position.setLength(getRandomInt(PLANET_RADIUS * 3, SKY_RADIUS));
            // random color
            sprite.material.color.setHSL(Math.random(), 0.9, 0.7);
            sprite.material.blending = THREE.AdditiveBlending; // "glowing" particles
            // add it
            particleGroup.add(sprite);
        }
        // make objects manage their own update method
        particleGroup.userData.updater = function (clock, particleGroup) {
            let time = 4 * clock.getElapsedTime();
            // rotate the entire group
            particleGroup.rotation.x = time * 0.005;
            particleGroup.rotation.y = time * 0.005;
            particleGroup.rotation.z = time * 0.005;
        };
        // add it
        scene.add(particleGroup);
    };

    let createStarfield = function () {
        let texture = textureLoader.load('assets/textures/galaxy_starfield.png');
        let material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide
        });
        // build a planet
        let geometry = new THREE.SphereGeometry(200, 32, 32);
        let mesh = new THREE.Mesh(geometry, material);
        // make an updater
        mesh.userData.updater = function (clock, mesh) {
            let time = 4 * clock.getElapsedTime();
            // rotate the entire group
            mesh.rotation.x = time * 0.0025;
            mesh.rotation.z = time * 0.0025;
            mesh.rotation.z = time * 0.0025;
        };
        scene.add(mesh);
    };

    let loadPlanet = function ( ) {

        let geometry = new THREE.SphereBufferGeometry(PLANET_RADIUS, PLANET_SEGMENTS, PLANET_SEGMENTS);

        let marsMaterial = new THREE.MeshPhongMaterial({
            map: textureLoader.load('assets/textures/rock.jpg'),
            bumpMap: textureLoader.load('assets/textures/rock.jpg')
        });

        let maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

        marsMaterial.map.anisotropy = maxAnisotropy;
        marsMaterial.bumpMap.anisotropy = maxAnisotropy;
        marsMaterial.map.minFilter = THREE.LinearFilter;
        let TEXTURE_REPEAT = 10;
        marsMaterial.map.wrapS = THREE.RepeatWrapping;
        marsMaterial.map.wrapT = THREE.RepeatWrapping;
        marsMaterial.map.repeat.set(TEXTURE_REPEAT, TEXTURE_REPEAT);


        // mars planet
        let marsMesh = new THREE.Mesh(geometry, marsMaterial);
        marsMesh.receiveShadow = true;
        marsMesh.castShadow = true;

        scene.add(marsMesh);
    };

    let loadPlayer = function () {


        const PLAYER_POSITIONS = {
            "posX": 0,
            "posY": PLANET_RADIUS + 0.3,
            "posZ": 0,
            "degX": 0,
            "degY": 0,
            "degZ": 0
        }


        // player axis object at the center of the world. the axis quaternion
        // rotates and the player is attached to it at an offset so appears to
        // be moving - like swinging an object on a string
        playerAxis = new THREE.Object3D();

        // the player group is the container for the player object and it's two
        // cameras so everything moves relative to this
        playerGroup = new THREE.Group();

        colladaLoader.load('assets/models/space_fighter.dae', function (collada) {
            let avatar = collada.scene;
            // add some color to it
            avatar.children[0].material.color.setRGB(0.5, 0.5, 0.5); // nose bottom
            avatar.children[1].material.color.setRGB(0.2, 0, 0); // body accents
            avatar.children[2].material.color.setRGB(1, 0.4, 0.0); // engine exhaust
            avatar.children[3].material.color.setRGB(0.3, 0.3, 0.3); // body
            // attach it
            playerGroup.add(avatar);
        });

        // add the player to the orb
        playerAxis.add(playerGroup);

        playerGroup.position.set(PLAYER_POSITIONS.posX, PLAYER_POSITIONS.posY, PLAYER_POSITIONS.posZ);

        let applyRotations = function (sceneObject, positions) {
            // convert rotations from degrees to radians
            let radX = positions.degX * (Math.PI / 180);
            let radY = positions.degY * (Math.PI / 180);
            let radZ = positions.degZ * (Math.PI / 180);
            sceneObject.rotation.set(radX, radY, radZ);
        };

        // allows use of rotation degrees rather than radians 
        applyRotations(playerGroup, PLAYER_POSITIONS);

        // chase camera is added to the player oibject
        // and set up and back a little
        playerGroup.add(chaseCamera);

        // chase camera position constants
        const CHASECAM_OFFSET = {
            back: -3.0,
            up: 1.5
        };

        // position and point the camera
        chaseCamera.position.set(0, CHASECAM_OFFSET.up, CHASECAM_OFFSET.back);
        chaseCamera.lookAt(playerGroup.position);

        // chase camera is added to the player oibject
        // and set up and back a little
        playerGroup.add(overheadCamera);

        // camera position constants
        const OVERHEADCAM_OFFSET = {
            back: 0,
            up: 10
        };

        // position and point the camera
        overheadCamera.position.set(0, OVERHEADCAM_OFFSET.up, OVERHEADCAM_OFFSET.back);
        overheadCamera.lookAt(0, -1, 0);

        // can set the initial axis rotation after all objects attached
        // set start position on the side
        playerAxis.quaternion.multiply(new THREE.Quaternion(-1, 0, 0)).normalize();

        // align the overhead camera
        overheadCamera.rotation.z = Math.PI;

        // add everything to the scene
        scene.add(playerAxis);
    };

    // Move and turn speeds
    const TS = 0.04;
    const MS = 0.01;

    // Define the move quaternions once
    const QR = {
        xPosQ: new THREE.Quaternion(+MS, 0, 0),
        xNegQ: new THREE.Quaternion(-MS, 0, 0),
        yPosQ: new THREE.Quaternion(0, +TS, 0),
        yNegQ: new THREE.Quaternion(0, -TS, 0),
        zPosQ: new THREE.Quaternion(0, 0, +MS),
        zNegQ: new THREE.Quaternion(0, 0, -MS)
    };

    // Apply quaternion rotations via keyboard inputy
    let updatePlayer = function (actions) {
        if (actions.moveForward)
            playerAxis.quaternion.multiply(QR.xPosQ).normalize();
        if (actions.moveBackward)
            playerAxis.quaternion.multiply(QR.xNegQ).normalize();
        if (actions.turnLeft)
            playerAxis.quaternion.multiply(QR.yPosQ).normalize();
        if (actions.turnRight)
            playerAxis.quaternion.multiply(QR.yNegQ).normalize();
        if (actions.strafeRight)
            playerAxis.quaternion.multiply(QR.zPosQ).normalize();
        if (actions.strafeLeft)
            playerAxis.quaternion.multiply(QR.zNegQ).normalize();
    };

    let render = function () {
        let children = scene.children;

        // all objects with updates contain their own
        for (let i = 0; i < children.length; i++) {
            if (children[i].userData.hasOwnProperty('updater')) {
                children[i].userData.updater(clock, children[i]);
            }
        }

        updatePlayer(key_events.actions);

        //updateChaseCamera();
        if (key_events.actions.chaseCameraOn) {
            renderer.render(scene, chaseCamera);
        } else {
            renderer.render(scene, overheadCamera);
        }

        requestAnimationFrame(render);
    };
    
    window.addEventListener('resize', function () {
        chaseCamera.aspect = window.innerWidth / window.innerHeight;
        chaseCamera.updateProjectionMatrix();
        overheadCamera.aspect = window.innerWidth / window.innerHeight;
        overheadCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);


    (function () {
        loadLighting();
        loadCameras();
        loadSkyGlowies();
        createStarfield();
        loadPlanet();
        loadPlayer();
        render();
    })(); // call itself

})();