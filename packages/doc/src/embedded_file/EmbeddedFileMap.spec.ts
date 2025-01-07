import { PDFDocument } from "../Document";

async function reloadDocument(doc: PDFDocument): Promise<PDFDocument> {
  const raw = await doc.save();
  return PDFDocument.load(raw);
}

describe("EmbeddedFileMap", () => {
  let doc: PDFDocument;

  beforeEach(async () => {
    doc = await PDFDocument.create();
  });

  it("should have an empty map for new document", () => {
    expect(doc.embeddedFiles.size).toBe(0);
    expect([...doc.embeddedFiles]).toHaveLength(0);
  });

  describe("attach", () => {
    it("should attach files with minimal parameters", () => {
      const file = {
        name: "test.txt",
        id: "test-id",
        data: Buffer.from("test content")
      };

      doc.embeddedFiles.attach(file);

      expect(doc.embeddedFiles.size).toBe(1);
      const embedded = doc.embeddedFiles.get(file.id);
      expect(embedded.name).toBe(file.name);
    });

    it("should attach files with all parameters", async () => {
      const created = new Date("2023-01-01");
      const modified = new Date("2023-01-02");
      const file = {
        name: "test.txt",
        id: "test-id",
        data: Buffer.from("test content"),
        description: "Test file",
        created,
        modified
      };

      doc.embeddedFiles.attach(file);
      const doc2 = await reloadDocument(doc);

      const embedded = doc2.embeddedFiles.get(file.id);
      expect(embedded.name).toBe(file.name);
      expect(embedded.description).toBe(file.description);
      expect(embedded.created).toEqual(created);
      expect(embedded.updated).toEqual(modified);
      expect(doc2.embeddedFiles.target.Names.has()).toBeTruthy();
    });

    it("should generate id if not provided", () => {
      const file = {
        name: "test.txt",
        data: Buffer.from("test content")
      };

      doc.embeddedFiles.attach(file);

      expect(doc.embeddedFiles.size).toBe(1);
      const [id] = [...doc.embeddedFiles][0];
      expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    });
  });

  describe("find", () => {
    it("should return null for non-existent key", () => {
      expect(doc.embeddedFiles.find("non-existent")).toBeNull();
    });

    it("should find existing file", () => {
      const file = {
        name: "test.txt",
        id: "test-id",
        data: Buffer.from("test content")
      };

      doc.embeddedFiles.attach(file);
      const found = doc.embeddedFiles.find(file.id);

      expect(found).not.toBeNull();
      expect(found?.name).toBe(file.name);
    });
  });

  describe("get", () => {
    it("should throw error for non-existent key", () => {
      expect(() => doc.embeddedFiles.get("non-existent")).toThrow(
        "Cannot retrieve the value for the given key 'non-existent'"
      );
    });

    it("should get existing file", () => {
      const file = {
        name: "test.txt",
        id: "test-id",
        data: Buffer.from("test content")
      };

      doc.embeddedFiles.attach(file);
      const retrieved = doc.embeddedFiles.get(file.id);

      expect(retrieved.name).toBe(file.name);
    });
  });

  describe("persistence", () => {
    it("should persist embedded files after save/load", async () => {
      const files = [
        { name: "file1.txt", id: "id1", data: Buffer.from("content1") },
        { name: "file2.txt", id: "id2", data: Buffer.from("content2") }
      ];

      files.forEach((file) => doc.embeddedFiles.attach(file));
      const doc2 = await reloadDocument(doc);

      expect(doc2.embeddedFiles.size).toBe(files.length);

      files.forEach((file) => {
        const embedded = doc2.embeddedFiles.find(file.id);
        expect(embedded).not.toBeNull();
        expect(embedded?.name).toBe(file.name);
      });
    });
  });

  describe("iterator", () => {
    it("should iterate over all files", () => {
      const files = [
        { name: "file1.txt", id: "id1", data: Buffer.from("content1") },
        { name: "file2.txt", id: "id2", data: Buffer.from("content2") }
      ];

      files.forEach((file) => doc.embeddedFiles.attach(file));

      const entries = [...doc.embeddedFiles];
      expect(entries).toHaveLength(files.length);

      entries.forEach(([id, file], index) => {
        expect(id).toBe(files[index].id);
        expect(file.name).toBe(files[index].name);
      });
    });

    it("should return empty iterator when no files", () => {
      expect([...doc.embeddedFiles]).toHaveLength(0);
    });
  });
});
