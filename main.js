// ----- Start of the assigment ----- //

class Particle extends PIXI.Container {
	constructor() {
		super();
		// Set start and duration for this effect in milliseconds
		this.start    = 0;
		this.duration = 750;
		// Create a sprite
		let sp        = game.sprite("CoinsGold000");
		// Set pivot to center of said sprite
		sp.pivot.x    = sp.width/2;
		sp.pivot.y    = sp.height/2;
		// Add the sprite particle to our particle effect
		this.addChild(sp);
		// Save a reference to the sprite particle
		this.sp = sp;
		
		// second sprite overlay for better smoothness - doesnt work very well tho
		let sp2       = game.sprite("CoinsGold001");
		sp2.pivot.x    = sp.pivot.x;
		sp2.pivot.y    = sp.pivot.y;
    sp2.blendMode = PIXI.BLEND_MODES.OVERLAY;
		this.addChild(sp2);
		this.sp2 = sp2;
		
		this.init();
	}

	init() {
		// random movement scaling factors for xyz
		this.dirX = 2 * (Math.random() - 0.5);
		this.dirY = 2 * (Math.random() - 0.5);
		this.dirZ = 0.5 + 0.5 * (Math.random());
		
		// spin scaling factor
		let spin = 2 * (Math.random() - 0.5) * (this.dirX + this.dirY) / 2;
		// looks a bit weird if too little spin so use a floor
		if(spin > 0.5 || spin < -0.5) this.spin = spin;
		else if(spin > 0) 						this.spin = 0.5;
		else 													this.spin = -0.5;

		// individual sprite evolution speed: 0.75 to 2ish (two rotations)
		this.timingScale = 0.75 + 1.33 * Math.random();

		// slightly spread origin pos, determine amount to move each tick
		this.startX = game.heightX / 2 + Math.floor(0.035 * game.heightX * this.dirX);
		this.moveX = Math.floor(0.85 * game.heightX / 2 * this.dirX * Math.random());
		this.startY = game.heightY / 1.5 + Math.floor(0.055 * game.heightY * this.dirY);
		this.moveY = Math.floor(0.85 * game.heightY / 2 * this.dirY * Math.random());
	}
	
	animTick(nt,lt,gt) {
		// Every update we get three different time variables: nt, lt and gt.
		//   nt: Normalized time in procentage (0.0 to 1.0) and is calculated by
		//       just dividing local time with duration of this effect.
		//   lt: Local time in milliseconds, from 0 to this.duration.
		//   gt: Global time in milliseconds,

		if(this.nt > nt) // reset each iteration
			this.init();
		this.nt = nt;

		// Set a new texture on a sprite particle
		// depending on scale might loop multiple times
		let spriteAnimPos = (this.timingScale * nt*8) % 8;
		let texturePos = Math.floor(spriteAnimPos);
		let blendNextAmount = spriteAnimPos - texturePos;
		let textureNum = (this.spin > 0? texturePos: 8 - texturePos)
		let num = ("000" + textureNum).substr(-3);
		game.setTexture(this.sp,"CoinsGold"+num);
		
		// Animate position. Start slow then speed up (not realistic but looks alright)
		this.sp.x = this.startX + Math.pow(nt, 0.82) * this.moveX;
		// Y gets a little "toss upwards then fall back"
		this.sp.y = this.startY + Math.pow(nt, 0.75) * this.moveY - Math.abs(this.moveY) * Math.sin(nt * Math.PI);
		
		// slightly separate sprites so faster Z aka. scale means in front
		this.sp.z = this.dirZ;
		
		// Animate scale based on Z speed
		this.sp.scale.x = this.sp.scale.y = Math.pow(nt * 0.9, 1.3) * 0.92 * this.dirZ;
		
		// Animate alpha. if not moving much, fade in quicker or looks weird...
		let velocity = 0.5 * (Math.abs(this.dirX) + Math.abs(this.dirY));
		let alpha = 0.75 * nt + (0.5 * (1.0 - velocity));
		this.sp.alpha = alpha > 1.0? 1.0: alpha;
		
		// Animate rotation
		this.sp.rotation = this.spin * nt*Math.PI*2;

		// our second sprite has identical everything
		this.sp2.x = this.sp.x;
		this.sp2.y = this.sp.y;
		this.sp2.z = this.sp.z + 1;
		this.sp2.scale.x = this.sp.scale.x;
		this.sp2.scale.y = this.sp.scale.y;
		this.sp2.rotation = this.sp.rotation;
		
		// except for texture - blend in next/previous
		let textureNum2 = Math.abs((this.spin > 0? texturePos + 1: 8 - texturePos - 1) % 8);
		let num2 = ("000" + textureNum2).substr(-3);
		game.setTexture(this.sp2,"CoinsGold"+num2);
		this.sp2.alpha = blendNextAmount;
	}
}

// ----- End of the assigment ----- //

class Game {
	constructor(props) {
		this.totalDuration = 0;
		this.effects = [];
		this.heightX = 800;
		this.heightY = 450;
		this.renderer = new PIXI.WebGLRenderer(this.heightX,this.heightY);
		document.body.appendChild(this.renderer.view);
		this.stage = new PIXI.Container();
		this.loadAssets(props&&props.onload);
	}
	loadAssets(cb) {
		let textureNames = [];
		// Load coin assets
		for (let i=0; i<=8; i++) {
			let num  = ("000"+i).substr(-3);
			let name = "CoinsGold"+num;
			let url  = "gfx/CoinsGold/"+num+".png";
			textureNames.push(name);
			PIXI.loader.add(name,url);
		}
		PIXI.loader.load(function(loader,res){
			// Access assets by name, not url
			let keys = Object.keys(res);
			for (let i=0; i<keys.length; i++) {
				var texture = res[keys[i]].texture;
				if ( ! texture) continue;
				PIXI.utils.TextureCache[keys[i]] = texture;
			}
			// Assets are loaded and ready!
			this.start();
			cb && cb();
		}.bind(this));
	}
	start() {	
		this.isRunning = true;
		this.t0 = Date.now();
		update.bind(this)();
		function update(){
			if ( ! this.isRunning) return;
			this.tick();
			this.render();
			requestAnimationFrame(update.bind(this));
		}
	}
	addEffect(eff) {
		this.totalDuration = Math.max(this.totalDuration,(eff.duration+eff.start)||0);
		this.effects.push(eff);
		this.stage.addChild(eff);
	}
	render() {
		this.renderer.render(this.stage);
	}
	tick() {
		let gt = Date.now();
		let lt = (gt-this.t0) % this.totalDuration;
		for (let i=0; i<this.effects.length; i++) {
			let eff = this.effects[i];
			if (lt>eff.start+eff.duration || lt<eff.start) continue;
			let elt = lt - eff.start;
			let ent = elt / eff.duration;
			eff.animTick(ent,elt,gt);
		}
	}
	sprite(name) {
		return new PIXI.Sprite(PIXI.utils.TextureCache[name]);
	}
	setTexture(sp,name) {
		sp.texture = PIXI.utils.TextureCache[name];
		if ( ! sp.texture) console.warn("Texture '"+name+"' don't exist!")
	}
}

window.onload = function(){
	window.game = new Game({onload:function(){
		let amount = 40;
		for(let i=0; i < amount; i++)
			game.addEffect(new Particle());
	}});
}
