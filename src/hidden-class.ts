export interface IHiddenClass {
  addProperty(name: string): IHiddenClass;
  getPropertyIndex(name: string): number | undefined;
  getPropertyCount(): number;
}

export class HiddenClass implements IHiddenClass {
  private propertyIndexes: Map<string, number>;
  private transitionCache: Map<string, HiddenClass>;
  private propertyCount: number;

  constructor() {
    this.propertyIndexes = new Map();
    this.transitionCache = new Map();
    this.propertyCount = 0;
  }

  public addProperty(name: string): IHiddenClass {
    // Check if we already have a transition for this property
    const existing = this.transitionCache.get(name);
    if (existing) {
      return existing;
    }

    // Create a new hidden class with the additional property
    const newClass = new HiddenClass();
    // Copy existing property indexes
    this.propertyIndexes.forEach((index, prop) => {
      newClass.propertyIndexes.set(prop, index);
    });
    // Add new property
    newClass.propertyIndexes.set(name, this.propertyCount);
    newClass.propertyCount = this.propertyCount + 1;

    // Cache the transition
    this.transitionCache.set(name, newClass);

    return newClass;
  }

  public getPropertyIndex(name: string): number | undefined {
    return this.propertyIndexes.get(name);
  }

  public getPropertyCount(): number {
    return this.propertyCount;
  }
}
