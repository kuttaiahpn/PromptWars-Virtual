import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useGameState } from '../state/GameStateProvider';

export const GameCanvas = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  // @ts-ignore
  const { playerMode, togglePlayerMode } = useGameState();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('change-player-mode', { detail: playerMode }));
  }, [playerMode]);

  useEffect(() => {
    const handleRequest = (e: any) => {
      if (e.detail === 'PRINCE' && playerMode === 'SPACESHIP') {
        togglePlayerMode();
      } else if (e.detail === 'SPACESHIP' && playerMode === 'PRINCE') {
        togglePlayerMode();
      }
    };
    window.addEventListener('change-player-mode-request', handleRequest);
    return () => window.removeEventListener('change-player-mode-request', handleRequest);
  }, [playerMode, togglePlayerMode]);

  useEffect(() => {
    if (!gameRef.current) return;

    class MainScene extends Phaser.Scene {
      player!: Phaser.Physics.Arcade.Sprite;
      currentMode: 'SPACESHIP' | 'PRINCE' | 'TRANSITION' = 'SPACESHIP';
      vpad: Record<string, boolean> = { up: false, down: false, left: false, right: false, action1: false, action2: false };
      bullets!: Phaser.Physics.Arcade.Group;
      platforms!: Phaser.Physics.Arcade.StaticGroup;
      dockingZones!: Phaser.Physics.Arcade.StaticGroup;
      lastFired: number = 0;
      isDocking: boolean = false;
      boss!: Phaser.Physics.Arcade.Sprite;
      shieldSprite!: Phaser.GameObjects.Sprite;
      overloadSwitch!: Phaser.Physics.Arcade.StaticSprite;
      bossShieldActive: boolean = true;
      isSwinging: boolean = false;
      lastSwung: number = 0;

      constructor() {
        super('MainScene');
      }

      create() {
        // Draw Prince (Rectangle)
        const g2 = this.add.graphics();
        g2.fillStyle(0xff00ff, 1);
        g2.fillRect(0, 0, 16, 32);
        g2.generateTexture('prince', 16, 32);
        g2.destroy();

        // Draw Spaceship (Triangle)
        const g = this.add.graphics();
        g.fillStyle(0x00f3ff, 1);
        g.lineStyle(2, 0x00f3ff, 1);
        g.beginPath();
        g.moveTo(10, 0);
        g.lineTo(20, 20);
        g.lineTo(0, 20);
        g.closePath();
        g.fillPath();
        g.generateTexture('spaceship', 20, 20);
        g.destroy();

        // Draw Bolt
        const g3 = this.add.graphics();
        g3.fillStyle(0x39ff14, 1);
        g3.fillCircle(4, 4, 4);
        g3.generateTexture('bolt', 8, 8);
        g3.destroy();

        // Environment platform
        const platG = this.add.graphics();
        platG.fillStyle(0x111122, 1);
        platG.fillRect(0, 0, 1200, 40);
        platG.generateTexture('platform', 1200, 40);
        platG.destroy();

        // Docking Zone Trigger
        const dockG = this.add.graphics();
        dockG.fillStyle(0xffff00, 0.2);
        dockG.lineStyle(2, 0xffff00);
        dockG.strokeRect(0, 0, 150, 150);
        dockG.fillRect(0, 0, 150, 150);
        dockG.generateTexture('docking-zone', 150, 150);
        dockG.destroy();

        // Draw Switch
        const switchG = this.add.graphics();
        switchG.fillStyle(0xff0000, 1);
        switchG.fillRect(0, 0, 30, 30);
        switchG.generateTexture('switch', 30, 30);
        switchG.destroy();

        // Draw Boss (Shakun)
        const bossG = this.add.graphics();
        bossG.fillStyle(0x0000ff, 1); 
        bossG.fillRect(0, 0, 40, 40);
        bossG.generateTexture('shakun', 40, 40);
        bossG.destroy();

        // Draw Shield
        const shieldG = this.add.graphics();
        shieldG.lineStyle(4, 0x00ffff, 0.8);
        shieldG.strokeCircle(20, 20, 30);
        shieldG.generateTexture('shield', 60, 60);
        shieldG.destroy();

        this.bullets = this.physics.add.group({
          defaultKey: 'bolt',
          maxSize: 10
        });

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(600, 700, 'platform');

        this.dockingZones = this.physics.add.staticGroup();
        this.dockingZones.create(1100, 300, 'docking-zone'); // Map end

        this.player = this.physics.add.sprite(400, 300, 'spaceship');
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
        
        // Spawn Fort elements
        this.overloadSwitch = this.physics.add.staticSprite(200, 660, 'switch');
        this.boss = this.physics.add.sprite(900, 400, 'shakun');
        this.boss.setCollideWorldBounds(true);
        this.physics.add.collider(this.boss, this.platforms);
        this.shieldSprite = this.add.sprite(this.boss.x, this.boss.y, 'shield');

        // Physics interactions
        this.physics.add.overlap(this.player, this.dockingZones, this.handleDocking, undefined, this);
        this.physics.add.overlap(this.player, this.overloadSwitch, this.handleSwitchPress, undefined, this);
        this.physics.add.overlap(this.player, this.boss, this.handleBossCollision, undefined, this);

        // Input listeners
        window.addEventListener('vpad-start', this.handleVpadStart);
        window.addEventListener('vpad-end', this.handleVpadEnd);
        window.addEventListener('change-player-mode', this.handleModeChange);

        // Initial setup
        this.applyModePhysics('SPACESHIP');
      }

      handleVpadStart = (e: any) => { this.vpad[e.detail.button] = true; };
      handleVpadEnd = (e: any) => { this.vpad[e.detail.button] = false; };
      handleModeChange = (e: any) => { 
        this.currentMode = e.detail; 
        this.applyModePhysics(this.currentMode as 'SPACESHIP' | 'PRINCE');
      };

      handleDocking = () => {
        if (this.currentMode !== 'SPACESHIP' || this.isDocking) return;
        this.isDocking = true;
        this.currentMode = 'TRANSITION'; // Halt physical inputs

        if (this.player.body) {
          this.player.setAcceleration(0);
          this.player.setVelocity(0);
          this.player.setAngularVelocity(0);
        }

        // Cinematic Zoom Into Ship
        this.cameras.main.pan(this.player.x, this.player.y, 1000, 'Sine.easeInOut');
        this.cameras.main.zoomTo(3, 1000, 'Sine.easeInOut');

        // Transition Jump Out Animation
        this.time.delayedCall(1200, () => {
          // Tell React Overlay to Switch Mode
          window.dispatchEvent(new CustomEvent('change-player-mode-request', { detail: 'PRINCE' }));

          this.currentMode = 'PRINCE';
          this.applyModePhysics('PRINCE');

          // Jump backwards out of the ship
          this.player.setVelocityY(-600);
          this.player.setVelocityX(-400); 

          // Pan camera out softly to follow the Prince
          this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
          this.cameras.main.zoomTo(1, 1500, 'Sine.easeInOut');
          
          this.isDocking = false;
        });
      };

      handleSwitchPress = () => {
        if (!this.bossShieldActive || this.currentMode !== 'PRINCE') return;
        this.bossShieldActive = false;
        if (this.shieldSprite && this.shieldSprite.active) this.shieldSprite.destroy();
        this.overloadSwitch.setTint(0x555555); // darken switch
      };

      handleBossCollision = () => {
        if (this.currentMode !== 'PRINCE') return;

        if (this.isSwinging) {
          if (this.bossShieldActive) {
            // Bounce off shield
            this.player.setVelocityX(this.player.x < this.boss.x ? -600 : 600);
          } else {
            // Defeat Boss
            if (this.boss.active) {
                this.boss.destroy();
                // Victory indicator text
                const text = this.add.text(this.player.x, this.player.y - 100, 'SHAKUN DEFEATED', { fontFamily: 'Orbitron', fontSize: '32px', color: '#39ff14' }).setOrigin(0.5);
                this.time.delayedCall(3000, () => text.destroy());
            }
          }
        } else {
          // Player takes damage or bounces
          this.player.setVelocityX(this.player.x < this.boss.x ? -400 : 400);
          this.player.setVelocityY(-300);
          
          // Attempt dispatch take-damage event if desired
          // window.dispatchEvent(new CustomEvent('take-damage', { detail: 10 }));
        }
      };

      applyModePhysics(mode: 'SPACESHIP' | 'PRINCE') {
        if (mode === 'SPACESHIP') {
          this.physics.world.gravity.y = 0;
          this.player.setTexture('spaceship');
          this.player.setDrag(0);
          this.player.setAngularDrag(100);
          this.player.setMaxVelocity(300);
          this.player.setGravityY(0);
        } else {
          // Prince Mode
          this.physics.world.gravity.y = 1200;
          this.player.setTexture('prince');
          this.player.setRotation(0);
          this.player.setDragX(500);
          this.player.setAngularDrag(0);
          this.player.setMaxVelocity(300, 800);
          this.player.setAcceleration(0);
          this.player.setAngularVelocity(0);
        }
      }

      update(time: number, delta: number) {
        if (this.currentMode === 'TRANSITION') return;

        if (this.currentMode === 'SPACESHIP') {
          // Spaceship asteroid drift physics
          if (this.vpad.left) {
            this.player.setAngularVelocity(-300);
          } else if (this.vpad.right) {
            this.player.setAngularVelocity(300);
          } else {
            this.player.setAngularVelocity(0);
          }

          if (this.vpad.up) {
            this.physics.velocityFromRotation(this.player.rotation - Math.PI/2, 250, this.player.body?.acceleration);
          } else {
            this.player.setAcceleration(0);
          }

          if (this.vpad.down) {
            // Manual brake
            if (this.player.body) {
              this.player.setVelocity(this.player.body.velocity.x * 0.96, this.player.body.velocity.y * 0.96);
            }
          }

          if (this.vpad.action1 && time > this.lastFired) {
            const bullet = this.bullets.get(this.player.x, this.player.y);
            if (bullet) {
              bullet.setActive(true).setVisible(true);
              this.physics.velocityFromRotation(this.player.rotation - Math.PI/2, 600, bullet.body.velocity);
              this.lastFired = time + 200;
              this.time.delayedCall(1500, () => {
                bullet.setActive(false).setVisible(false);
              });
            }
          }
        } else {
          // Prince 2D Platformer physics
          if (!this.player.body) return;
          const touchingDown = this.player.body.touching.down || this.player.body.blocked.down;

          // Sync shield sprite to boss position
          if (this.bossShieldActive && this.boss.active && this.boss.body) {
            this.shieldSprite.setPosition(this.boss.x, this.boss.y);
          }

          if (this.vpad.left) {
            this.player.setAccelerationX(-800);
          } else if (this.vpad.right) {
            this.player.setAccelerationX(800);
          } else {
            this.player.setAccelerationX(0);
            this.player.setDragX(1000);
          }

          if (this.vpad.up && touchingDown) {
            // Jump mapped to W/up instead of action1
            this.player.setVelocityY(-600);
          }
          
          if (this.vpad.action1 && time > this.lastSwung) {
            // Plasma Sword Swing
            this.lastSwung = time + 400;
            this.isSwinging = true;
            this.player.setTint(0xffffff); // Visual indicator
            this.time.delayedCall(200, () => { 
                this.isSwinging = false; 
                this.player.clearTint();
            });
          }
          
          if (this.vpad.action2 && touchingDown) {
            // Combat Roll Dash
            this.player.setVelocityX(this.player.body.velocity.x > 0 ? 600 : (this.player.body.velocity.x < 0 ? -600 : 600));
          }
        }
      }

      // Cleanup listeners on destroy
      sys_destroy() {
        window.removeEventListener('vpad-start', this.handleVpadStart);
        window.removeEventListener('vpad-end', this.handleVpadEnd);
        window.removeEventListener('change-player-mode', this.handleModeChange);
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: '100%',
      height: '100%',
      backgroundColor: '#050510',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      phaserGameRef.current?.scene.getScene('MainScene')?.events.emit('destroy');
      phaserGameRef.current?.destroy(true);
      phaserGameRef.current = null;
    };
  }, []);

  return <div ref={gameRef} className="absolute inset-0 w-full h-full z-10" />;
};
