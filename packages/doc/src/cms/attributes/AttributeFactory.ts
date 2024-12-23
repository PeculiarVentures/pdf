import { CmsAttribute, CmsAttributeConstructor } from "./Attribute";

export class CmsAttributeFactory {
  public static items = new Map<string, CmsAttributeConstructor>();

  public static register(type: string, value: CmsAttributeConstructor): void {
    this.items.set(type, value);
  }

  public static get(type: string): CmsAttributeConstructor {
    const value = this.items.get(type);

    if (!value) {
      return CmsAttribute;
    }

    return value;
  }
}
