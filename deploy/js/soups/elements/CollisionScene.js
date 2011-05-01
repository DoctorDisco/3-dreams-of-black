var CollisionScene = function ( camera, scene, scale, shared, collisionDistance, useOldRay ) {
	
	var that = this;
	that.currentNormal = new THREE.Vector3( 0, 1, 0 );
	that.emitterNormal = new THREE.Vector3( 0, 1, 0 );
	that.distance = 0;

	that.initSettings = {

	};

	that.settings = {

		useOldRay : useOldRay || false,
		maxSpeedDivider : 2,
		emitterDivider : 5,
		cameraTargetDivider : 10,
		capBottom : null,
		capTop : null,
		allowFlying : false,
		collisionDistance : collisionDistance || 400,
		scale : scale || 1.0,
		shootRayDown : false,
		keepEmitterFollowDown : false,
		normalOffsetAmount : 6,
		minDistance : 10,
		camera : camera,

	};

	var mouse2d = new THREE.Vector3( 0, 0, 1 );

	var ray = new THREE.Ray();
	var matrix = new THREE.Matrix4();
	var matrix2 = new THREE.Matrix4();
	var positionVector = new THREE.Vector3();
	// useOldRay
	var projector = new THREE.Projector();
	var collisionScene = new THREE.Scene();

	var cube = new THREE.Cube( 5, 5, 5 );

	that.emitter = addMesh( cube, 1, shared.camPos.x, shared.camPos.y, shared.camPos.z, 0,0,0, new THREE.MeshBasicMaterial( { color: 0xFFFF33, opacity: 0.4 } ) );
	that.emitterFollow = addMesh( cube, 1, shared.camPos.x, shared.camPos.y, shared.camPos.z, 0,0,0, new THREE.MeshBasicMaterial( { color: 0x33FFFF, opacity: 0.4 } ) );
	if (that.settings.useOldRay) {
		that.cameraTarget = addMesh( cube, 1, shared.camPos.x, shared.camPos.y, shared.camPos.z, 0,0,0, new THREE.MeshBasicMaterial( { color: 0x33FF33, opacity: 0.4 } ) );
	}

	that.emitter.visible = false;
	that.emitterFollow.visible = false;

	// collision boxes

	var cube = new THREE.Cube( 5000,5000,10, 1,1,1 );
	var material = new THREE.MeshLambertMaterial( { color: 0x0000FF, opacity: 0.2 } );
	var front = new THREE.Mesh ( cube, material	);
	var back = new THREE.Mesh ( cube, material );
	var cube = new THREE.Cube( 10,5000,5000, 1,1,1 );
	var left = new THREE.Mesh ( cube, material );
	var right = new THREE.Mesh ( cube, material	);
	var cube = new THREE.Cube( 5000,10,5000, 1,1,1 );
	var top = new THREE.Mesh ( cube, material );
	var bottom = new THREE.Mesh ( cube, material );

	if (that.settings.useOldRay) {

		collisionScene.addObject( front );
		collisionScene.addObject( back );
		collisionScene.addObject( left );
		collisionScene.addObject( right );
		collisionScene.addObject( top );
		collisionScene.addObject( bottom );
	
	} else {
		
		scene.addObject( front );
		scene.addObject( back );
		scene.addObject( left );
		scene.addObject( right );
		scene.addObject( top );
		scene.addObject( bottom );

		scene.collisions.colliders.push( THREE.CollisionUtils.MeshOBB( front ) );
		scene.collisions.colliders.push( THREE.CollisionUtils.MeshOBB( back ) );
		scene.collisions.colliders.push( THREE.CollisionUtils.MeshOBB( left ) );
		scene.collisions.colliders.push( THREE.CollisionUtils.MeshOBB( right ) );
		scene.collisions.colliders.push( THREE.CollisionUtils.MeshOBB( top ) );
		scene.collisions.colliders.push( THREE.CollisionUtils.MeshOBB( bottom ) );

		front.visible = false;
		back.visible = false;
		left.visible = false;
		right.visible = false;
		top.visible = false;
		bottom.visible = false;
	}

	this.addLoaded = function ( geometry, scale, rotation, position, realscene ) {

		var material = new THREE.MeshLambertMaterial( { color: 0xFF0000, opacity: 0.5 } );

		var mesh = new THREE.Mesh( geometry, material );

		mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
		mesh.rotation = rotation || new THREE.Vector3();
		mesh.position = position || new THREE.Vector3();

		collisionScene.addObject( mesh );

	};

	this.update = function ( camPos, delta ) {
		right.position.x = camPos.x + that.settings.collisionDistance;
		left.position.x  = camPos.x - that.settings.collisionDistance;
		right.position.z = camPos.z;
		right.position.y = camPos.y;
		left.position.z  = camPos.z;
		left.position.y  = camPos.y;

		front.position.z = camPos.z - that.settings.collisionDistance;
		back.position.z  = camPos.z + that.settings.collisionDistance;
		front.position.x = camPos.x;
		front.position.y = camPos.y;
		back.position.x  = camPos.x;
		back.position.y  = camPos.y;

		bottom.position.y = camPos.y - that.settings.collisionDistance;
		top.position.y    = camPos.y + that.settings.collisionDistance;
		bottom.position.x = camPos.x;
		bottom.position.z = camPos.z;
		top.position.x    = camPos.x;
		top.position.z    = camPos.z;

		if ( that.settings.capBottom != null ) {

			if ( bottom.position.y < that.settings.capBottom ) {
				 bottom.position.y = that.settings.capBottom;
			}

		}

		if ( that.settings.capTop != null ) {

			if ( top.position.y < that.settings.capTop ) {
				 top.position.y = that.settings.capTop;
			}

		}

		if (!that.settings.useOldRay) {

			mouse2d.x = ( shared.mouse.x / shared.screenWidth ) * 2 - 1;
			mouse2d.y = - ( shared.mouse.y / shared.screenHeight ) * 2 + 1;
			mouse2d.z = 1;

			ray.origin.copy( mouse2d );

			matrix.copy( that.settings.camera.matrixWorld );
			matrix.multiplySelf( THREE.Matrix4.makeInvert( that.settings.camera.projectionMatrix, matrix2 ) );
			matrix.multiplyVector3( ray.origin );
			
			ray.direction.copy( ray.origin );
			ray.direction.subSelf( camPos );

			var c = scene.collisions.rayCastNearest( ray );

			if( c && c.distance > that.settings.minDistance ) {

				var distance = c.distance*that.settings.scale;

				if ( distance > that.settings.collisionDistance ) {

					distance = that.settings.collisionDistance;

				}

				that.distance = distance;

				positionVector.copy( ray.origin );
				positionVector.addSelf( ray.direction.multiplyScalar( distance ) );
				
				that.emitter.position = positionVector;
				
				if ( c.normal != undefined ) {

					var normal = c.mesh.matrixRotationWorld.multiplyVector3( c.normal ).normalize();
					that.currentNormal = normal;
					that.emitterNormal = normal;

				}

				if ( c.mesh == right || c.mesh == front || c.mesh == back || c.mesh == left || c.mesh == top || c.mesh == bottom ) {

					that.currentNormal.set( 0, 1, 0 );

					// not to be airborne

					if ( !that.settings.allowFlying && !that.settings.shootRayDown ) {

						that.emitter.position.y = bottom.position.y;
						
					}

					if ( that.settings.shootRayDown ) {

						ray.origin.copy( that.emitter.position );
						ray.direction.set( 0, -1, 0 );

						var c = scene.collisions.rayCastNearest( ray );
					
						that.emitter.position.y -= c.distance * that.settings.scale;

						var normal = c.mesh.matrixRotationWorld.multiplyVector3( c.normal ).normalize();
						that.currentNormal = normal;

					}

				}

				that.emitter.position.x += that.currentNormal.x * that.settings.normalOffsetAmount;
				that.emitter.position.y += that.currentNormal.y * that.settings.normalOffsetAmount;
				that.emitter.position.z += that.currentNormal.z * that.settings.normalOffsetAmount;
				
			} else {
			
				// no collsion

			}
		
		} else {
			
			// emitter
			var vector = new THREE.Vector3( ( shared.mouse.x / shared.screenWidth ) * 2 - 1, - ( shared.mouse.y / shared.screenHeight ) * 2 + 1, 0.5 );
			projector.unprojectVector( vector, camera );
			var rayOld = new THREE.Ray( camPos, vector.subSelf( camPos ).normalize() );
			var intersects = rayOld.intersectScene( collisionScene );

			//var emitterNormal = new THREE.Vector3(0,1,0);

			if ( intersects.length > 0 ) {

				for ( var i = 0; i < intersects.length; ++i ) {

					var check = vector.z < 0 ? intersects[i].point.z < camPos.z : intersects[i].point.z > camPos.z;

					if ( check && intersects[i].object != that.emitter && intersects[i].object != that.emitterFollow ) {

						that.emitter.position = intersects[i].point;

						var dx = camPos.x-that.emitter.position.x;
						var dz = camPos.z-that.emitter.position.z;

						var angleRad = Math.atan2(dz, dx);
						that.emitter.position.x -= Math.cos( angleRad )*that.settings.minDistance/10;
						that.emitter.position.z -= Math.sin( angleRad )*that.settings.minDistance;					

						// hack for now...
						if (that.emitter.position.z > camPos.z-20) {
							that.emitter.position.z = camPos.z-20;
						}

						var face = intersects[i].face;
						var object = intersects[i].object;
						var normal = object.matrixRotationWorld.multiplyVector3( face.normal.clone() );
						that.emitterNormal = normal;
						
						// walls
						if (intersects[i].object == right || intersects[i].object == front || intersects[i].object == back || intersects[i].object == left || intersects[i].object == top) {
							that.emitterNormal.x = 0;
							that.emitterNormal.y = 1;
							that.emitterNormal.z = 0;
							// not to be airbourne
							if (!that.settings.allowFlying) {
								that.emitter.position.y = bottom.position.y+5;					
							}
						}

						break;
					}
				}

			}

		}



		if ( isNaN(delta) || delta > 1000 || delta == 0 ) {
			delta = 1000 / 60;
		}

		var maxSpeed = delta / that.settings.maxSpeedDivider;

		var tox = that.emitter.position.x;
		var moveX = ( tox - that.emitterFollow.position.x ) / that.settings.emitterDivider;

		var toy = that.emitter.position.y;
		var moveY = ( toy - that.emitterFollow.position.y ) / that.settings.emitterDivider;

		var toz = that.emitter.position.z;
		var moveZ = ( toz - that.emitterFollow.position.z ) / that.settings.emitterDivider;

		if ( moveY > maxSpeed ) moveY = maxSpeed;
		if ( moveY < -maxSpeed ) moveY = -maxSpeed;

		if ( moveX > maxSpeed ) moveX = maxSpeed;
		if ( moveX < -maxSpeed ) moveX = -maxSpeed;

		if ( moveZ > maxSpeed )	moveZ = maxSpeed;
		if ( moveZ < -maxSpeed ) moveZ = -maxSpeed;

		that.emitterFollow.position.x += moveX;
		that.emitterFollow.position.y += moveY;
		that.emitterFollow.position.z += moveZ;	


		if ( that.settings.keepEmitterFollowDown && !that.settings.useOldRay ) {

			that.emitterFollow.position.y = that.emitter.position.y + that.settings.collisionDistance;

			ray.origin.copy( that.emitterFollow.position );
			ray.direction.set( 0, -1, 0 );

			var c = scene.collisions.rayCastNearest( ray );

			if ( c ) {

				that.emitterFollow.position.y -= ( c.distance * that.settings.scale ) - that.settings.normalOffsetAmount;

				var normal = c.mesh.matrixRotationWorld.multiplyVector3( c.normal ).normalize();
				that.currentNormal = normal;

			}

		}

		if (that.settings.useOldRay) {

			// shoot rays in all directions from emitterFollow, clamp in the direction of the shortest distance
			var direction = new THREE.Vector3();
			var rayOld = new THREE.Ray( that.emitterFollow.position, direction );
			var shortestDistance = 10000;
			var shortestPoint = that.emitterFollow.position;
			var shortestObject;
			var shortestFace;

			// x left
			direction.set(-1,0,0);
			rayOld.direction = direction;
			var intersects = rayOld.intersectScene( collisionScene );

			if ( intersects.length > 0 ) {
				for ( var i = 0; i < intersects.length; ++i ) {
					if ( intersects[i].object != that.emitter && intersects[i].object != left && intersects[i].object != right ) {
						if (intersects[i].distance < shortestDistance) {
							shortestDistance = intersects[i].distance;
							shortestPoint = intersects[i].point;
							shortestFace = intersects[i].face;
							shortestObject = intersects[i].object;
						}
						break;
					}
				}
			}

			// x right
			direction.set(1,0,0);
			rayOld.direction = direction;
			var intersects = rayOld.intersectScene( collisionScene );

			if ( intersects.length > 0 ) {
				for ( var i = 0; i < intersects.length; ++i ) {
					if ( intersects[i].object != that.emitter && intersects[i].object != left && intersects[i].object != right ) {
						if (intersects[i].distance < shortestDistance) {
							shortestDistance = intersects[i].distance;
							shortestPoint = intersects[i].point;
							shortestFace = intersects[i].face;
							shortestObject = intersects[i].object;
						}
						break;
					}
				}
			}


			// y down
			direction.set(0,-1,0);
			rayOld.direction = direction;
			var intersects = rayOld.intersectScene( collisionScene );

			if ( intersects.length > 0 ) {
				for ( var i = 0; i < intersects.length; ++i ) {
					if ( intersects[i].object != that.emitter && intersects[i].object != top ) {
						if (intersects[i].distance < shortestDistance) {
							shortestDistance = intersects[i].distance;
							shortestPoint = intersects[i].point;
							shortestFace = intersects[i].face;
							shortestObject = intersects[i].object;
						}
						break;
					}
				}
			}


			// z forward
			/*direction.set(0,0,-1);
			rayOld.direction = direction;
			var intersects = rayOld.intersectScene( collisionScene );

			if ( intersects.length > 0 ) {
				for ( var i = 0; i < intersects.length; ++i ) {
					if ( intersects[i].object != that.emitter && intersects[i].object != front && intersects[i].object != back ) {
						if (intersects[i].distance < shortestDistance) {
							shortestDistance = intersects[i].distance;
							shortestPoint = intersects[i].point;
							shortestFace = intersects[i].face;
							shortestObject = intersects[i].object;
						}
						break;
					}
				}
			}

			// z back
			direction.set(0,0,1);
			rayOld.direction = direction;
			var intersects = rayOld.intersectScene( collisionScene );

			if ( intersects.length > 0 ) {
				for ( var i = 0; i < intersects.length; ++i ) {
					if ( intersects[i].object != that.emitter && intersects[i].object != front && intersects[i].object != back ) {
						if (intersects[i].distance < shortestDistance) {
							shortestDistance = intersects[i].distance;
							shortestPoint = intersects[i].point;
							shortestFace = intersects[i].face;
							shortestObject = intersects[i].object;
						}
						break;
					}
				}
			}*/

			// clamp to the closest "hit"
			that.emitterFollow.position = shortestPoint;

			if (shortestObject != undefined) {
				var normal = shortestObject.matrixRotationWorld.multiplyVector3( shortestFace.normal.clone() );
				that.currentNormal = normal;
			}

			/*var amount = 5;

			that.emitterFollow.position.x += that.currentNormal.x*amount;
			that.emitterFollow.position.y += that.currentNormal.y*amount;
			that.emitterFollow.position.z += that.currentNormal.z*amount;
			*/

			var toy = that.emitterFollow.position.y;
			var moveY = ( toy - that.cameraTarget.position.y ) / that.settings.cameraTargetDivider;

			var tox = that.emitterFollow.position.x;
			var moveX = ( tox - that.cameraTarget.position.x ) / that.settings.cameraTargetDivider;

			var toz = that.emitterFollow.position.z;
			var moveZ = ( toz - that.cameraTarget.position.z ) / that.settings.cameraTargetDivider;

			var maxSpeed = 8;
			var maxSpeedY = 4;

			if ( moveY > maxSpeedY )	moveY = maxSpeedY;
			if ( moveY < -maxSpeedY ) moveY = -maxSpeedY;

			if ( moveX > maxSpeed )	moveX = maxSpeed;
			if ( moveX < -maxSpeed ) moveX = -maxSpeed;

			if ( moveZ > maxSpeed )	moveZ = maxSpeed;
			if ( moveZ < -maxSpeed )moveZ = -maxSpeed;

			that.cameraTarget.position.x += moveX;
			that.cameraTarget.position.y += moveY;
			that.cameraTarget.position.z += moveZ;

			// hack for now...
			if (that.cameraTarget.position.z > camPos.z-80) {
				that.cameraTarget.position.z = camPos.z-80;
			}

	/*		emitterReal.position = that.emitter.position;
			emitterFollowReal.position = that.emitterFollow.position;
			cameraTargetReal.position = that.cameraTarget.position;
	*/
			shared.renderer.render( collisionScene, camera );
			//shared.renderer.render( scene, camera, renderTarget );
			shared.renderer.clear();

		}

	};

	function addMesh( geometry, scale, x, y, z, rx, ry, rz, material ) {

		var mesh = new THREE.Mesh( geometry, material );

		mesh.scale.set( scale, scale, scale );
		mesh.position.set( x, y, z );
		mesh.rotation.set( rx, ry, rz );

		mesh.updateMatrix();
		if (that.settings.useOldRay) {
			collisionScene.addObject( mesh );
		} else {
			scene.addObject( mesh );
		}

		return mesh;

	};

	this.reset = function ( x, y, z ) {

		that.emitter.position.set( x, y, z );
		that.emitterFollow.position.set( x, y, z );
		if (that.settings.useOldRay) {
			that.cameraTarget.position.set( x, y, z );
		}

	};

};
