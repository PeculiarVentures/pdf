export class UUID {
  /**
   * Generates UUID
   * @returns UUID string
   */
  public static generate(): string {
    return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`
      .replace(/[018]/g, c => {
        const n = parseInt(c, 10);

        return (n ^ (Math.random() * 256 | 0) & 15 >> n / 4).toString(16);
      })
      .toLocaleUpperCase();

  }
}
