/**
 * Event Bus - Type-safe event system
 * 
 * Enables decoupled communication between modal service,
 * image generation, and React components.
 */

import { KuriMarket } from '../types/market';
import { TemplateType } from '../stores/postCreationStore';

// Event type definitions
export interface EventMap {
  'modal:show': { market: KuriMarket };
  'modal:hide': {};
  'modal:backdrop-click': {};
  
  'image:generate-start': { 
    market: KuriMarket; 
    template: TemplateType; 
    userAddress: string;
  };
  'image:generate-complete': { 
    imageData: string; 
    downloadUrl: string; 
    generationTime: number;
  };
  'image:generate-error': { 
    error: string; 
    template: TemplateType;
  };
  'image:generate-progress': { 
    progress: number; 
    stage: string;
  };
  
  'share:start': { 
    method: 'native' | 'clipboard' | 'download';
    template: TemplateType;
  };
  'share:complete': { 
    method: 'native' | 'clipboard' | 'download';
    success: boolean;
  };
  'share:error': { 
    method: 'native' | 'clipboard' | 'download';
    error: string;
  };
}

type EventCallback<T = any> = (data: T) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   */
  public on<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<EventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unsubscribe from an event
   */
  public off<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<EventMap[K]>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      
      // Clean up empty event sets
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  public emit<K extends keyof EventMap>(
    event: K,
    data: EventMap[K]
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Create array copy to prevent issues if listeners modify the set during iteration
      const callbacks = Array.from(eventListeners);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event only once
   */
  public once<K extends keyof EventMap>(
    event: K,
    callback: EventCallback<EventMap[K]>
  ): () => void {
    const unsubscribe = this.on(event, (data) => {
      callback(data);
      unsubscribe();
    });
    
    return unsubscribe;
  }

  /**
   * Remove all listeners for an event or all events
   */
  public removeAllListeners(event?: keyof EventMap): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  public listenerCount(event: keyof EventMap): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size : 0;
  }

  /**
   * Get all registered event names
   */
  public eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

/**
 * React hook for using event bus in components
 */
import { useEffect, useRef } from 'react';

export function useEventBus() {
  const busRef = useRef(eventBus);
  
  return {
    emit: busRef.current.emit.bind(busRef.current),
    on: busRef.current.on.bind(busRef.current),
    off: busRef.current.off.bind(busRef.current),
    once: busRef.current.once.bind(busRef.current),
    eventBus: busRef.current,
  };
}

/**
 * Hook for subscribing to a single event with automatic cleanup
 */
export function useEventSubscription<K extends keyof EventMap>(
  event: K,
  callback: EventCallback<EventMap[K]>,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = eventBus.on(event, callback);
    return unsubscribe;
  }, [event, ...deps]);
}

/**
 * Analytics integration for event tracking
 */
import { trackEvent } from './analytics';

export function trackEventBusEvent<K extends keyof EventMap>(
  event: K,
  data: EventMap[K],
  additionalProps?: Record<string, any>
): void {
  // Convert event bus events to analytics events
  const analyticsEvent = `post_creation_${event.replace(':', '_')}`;
  
  // Use any type for trackEvent since it accepts custom event names
  (trackEvent as any)(analyticsEvent, {
    ...data,
    ...additionalProps,
    timestamp: Date.now(),
  });
}