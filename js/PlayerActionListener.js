

PlayerActionListener = function (domElement) {
    var scope = this;

    this.domElement = (domElement !== undefined) ? domElement : document;

    this.actions = {
        moveForward: false,
        moveBackward: false,
        turnLeft: false,
        turnRight: false,
        strafeLeft: false,
        strafeRight: false,
        chaseCameraOn: true,
    };

    this.onKeyDown = function (event) {
        switch (event.keyCode) {
            case 49: /*kb num 1*/
            case 35: /*num pad 1*/
                scope.actions.chaseCameraOn = !scope.actions.chaseCameraOn;
                break;
            case 87: /*W*/
            case 38: /*up arrow*/
                scope.actions.moveForward = true;
                scope.actions.moveBackward = false;
                break;
            case 68: /*D*/
            case 39: /*right arrow*/
                scope.actions.turnRight = true;
                scope.actions.turnLeft = false;
                break;
            case 65: /*A*/
            case 37: /*left arrow*/
                scope.actions.turnLeft = true;
                scope.actions.turnRight = false;
                break;
            case 83: /*S*/
            case 40: /*down arrow*/
                scope.actions.moveBackward = true;
                scope.actions.moveForward = false;
                break;
            case 81: /*Q*/
                scope.actions.strafeLeft = true;
                scope.actions.strafeRight = false;
                break;
            case 69: /*E*/
                scope.actions.strafeRight = true;
                scope.actions.strafeLeft = false;
                break;
        }
    };

    this.onKeyUp = function (event) {
        switch (event.keyCode) {
            case 87: /*W*/
            case 38: /*up arrow*/
                scope.actions.moveForward = false;
                break;
            case 68: /*D*/
            case 39: /*right arrow*/
                scope.actions.turnRight = false;
                break;
            case 65: /*A*/
            case 37: /*left arrow*/
                scope.actions.turnLeft = false;
                break;
            case 83: /*S*/
            case 40: /*down arrow*/
                scope.actions.moveBackward = false;
                break;
            case 81: /*Q*/
                scope.actions.strafeLeft = false;
                break;
            case 69: /*E*/
                scope.actions.strafeRight = false;
                break;
        }
    };

    this.domElement.addEventListener('keydown', this.onKeyDown, false);
    this.domElement.addEventListener('keyup', this.onKeyUp, false);
};


