import { gsap } from 'gsap';

export interface SceneProps {
  onComplete?: () => void;
}

export abstract class Scene {
  protected timeline: gsap.core.Timeline;
  
  constructor() {
    this.timeline = gsap.timeline({
      paused: true,
      onComplete: this.handleComplete.bind(this)
    });
  }

  /**
   * Abstract method that each scene must implement to create its animations
   */
  protected abstract createAnimations(): void;

  /**
   * Initializes the scene, creating the animations
   */
  public init(): void {
    this.createAnimations();
  }

  /**
   * Plays the scene animation
   */
  public play(): void {
    this.timeline.play();
  }

  /**
   * Stops the scene animation and resets it
   */
  public stop(): void {
    this.timeline.pause(0);
  }

  /**
   * Cleans up the scene, killing the timeline
   */
  public cleanup(): void {
    this.timeline.kill();
  }

  /**
   * Gets the timeline for this scene
   */
  public getTimeline(): gsap.core.Timeline {
    return this.timeline;
  }

  /**
   * Handler for when the scene completes
   */
  private handleComplete(): void {
    if (this.onComplete) {
      this.onComplete();
    }
  }

  private onComplete?: () => void;

  /**
   * Sets the onComplete callback
   */
  public setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }
} 