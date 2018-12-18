# quaternion_planet

![around we go](https://kellycode.github.io/quaternion_planet/screen_shot.jpg)

The rotation is accomplished with relative positions of connected objects.  First adding the only object that's rotated, an THREE.Object3D to the center of the scene, then adding a THREE.Group to that with an offset position just slightly more than the planet radius, then adding the fighter model to that with no offset and finally adding the chase camera to the same THREE.Group with an offset position and looking at the THREE.Group.  So everything rotates whenever the center THREE.Object3D Quaternion is rotated.  If my planet wasn't a perfect sphere, I'd need to get the height of the point under the fighter anyway and adjust the radius so it would be more efficient to just use raycast gravity and always point the ray down to the center of the planet to get the proper height.

Uses WASD and Arrows, No Mobile controls atm

Two Cameras, Chase and Overhead, controlled by either 1 key

Experiment in keeping an object in rotation around a planet using Quaternion Rotation.

Quaternion rotations seemed like a good idea to begin with but after this experiment, I think I prefer raycast gravity.
