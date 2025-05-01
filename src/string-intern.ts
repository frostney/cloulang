export class StringIntern {
  private static instance: StringIntern | null = null;
  private internedStrings: Map<string, string>;

  private constructor() {
    this.internedStrings = new Map<string, string>();
  }

  public static getInstance(): StringIntern {
    StringIntern.instance ??= new StringIntern();
    return StringIntern.instance;
  }

  public intern(str: string): string {
    const existing = this.internedStrings.get(str);
    if (existing) {
      return existing;
    }
    this.internedStrings.set(str, str);
    return str;
  }

  public clear(): void {
    this.internedStrings.clear();
  }
}
