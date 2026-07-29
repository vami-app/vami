declare module 'opossum' {
  import { EventEmitter } from 'events';

  namespace CircuitBreaker {
    export interface Options {
      timeout?: number;
      errorThresholdPercentage?: number;
      resetTimeout?: number;
      volumeThreshold?: number;
      [key: string]: any;
    }
  }

  class CircuitBreaker extends EventEmitter {
    constructor(fn: Function, options?: CircuitBreaker.Options);
    fire(...args: any[]): Promise<any>;
    fallback(fn: Function): this;
  }

  export = CircuitBreaker;
}
