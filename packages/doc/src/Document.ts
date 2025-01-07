import * as core from "@peculiar/pdf-core";
import * as font from "@peculiar/pdf-font";
import * as copy from "@peculiar/pdf-copy";
import { X509Certificate } from "@peculiar/x509";
import { BufferSource, Convert } from "pvtsutils";
import * as pkijs from "pkijs";
import { Image } from "./Image";
import { PDFPages } from "./Pages";
import { FontComponent } from "./Font";
import { Watermark, WatermarkParams } from "./Watermark";
import { FormObject } from "./FormObject";
import { WrapObject } from "./WrapObject";
import { Dss } from "./Dss";
import {
  IPdfCertificateStorageHandler,
  PDFCertificateStorageHandler
} from "./CertificateStorageHandler";
import { EmbeddedFileMap } from "./embedded_file";
import * as forms from "./forms";
import { PDFVersion } from "./Version";

export interface DocumentHandlerVerifyResult {
  err: null | Error;
  items: forms.SignatureVerifyResult[];
}

export interface PDFDocumentCreateCommonParameters {
  /**
   * Version. Default is PDF 2.0
   */
  version?: PDFVersion;
  /**
   * If `true` PDF document uses XRef table, otherwise XRef stream
   */
  useXrefTable?: boolean;
  /**
   * Disable adding of ASCII85Decode filter to PDF Stream objects. This option is used if `disableCompressedStreams` is `false`.
   */
  disableAscii85Encoding?: boolean;
  /**
   * Adds FlateDecode filter to streams if value is `false`
   */
  disableCompressedStreams?: boolean;
  disableCompressedObjects?: boolean;
}

export interface StandardEncryptionParameters
  extends core.StandardEncryptionHandlerCreateCommonParams {
  algorithm: keyof typeof core.CryptoFilterMethods;
}

export interface PublicKeyEncryptionParameters {
  permission?: core.PublicKeyPermissionFlags;
  encryptMetadata?: boolean;
  algorithm: keyof typeof core.CryptoFilterMethods;
  recipients: X509Certificate[];
}

export type PDFDocumentCreateParameters =
  | PDFDocumentCreateCommonParameters
  | (PDFDocumentCreateCommonParameters & StandardEncryptionParameters)
  | (PDFDocumentCreateCommonParameters & PublicKeyEncryptionParameters);

export interface PDFDocumentSignParameters
  extends forms.SignatureBoxSignParameters {
  groupName?: string;
}

export interface PDFDocumentLoadParameters {
  /**
   * An optional callback function that is invoked whenever the PDF document is password-protected.
   * The application will keep invoking this callback until a correct password is provided or the password input is cancelled.
   * This allows you to handle multiple password input attempts.
   *
   * The function receives a single argument, a `reason`, which can be either `PasswordReason.first` for the first password input
   * attempt or `PasswordReason.incorrect` if the previously provided password was incorrect.
   * Depending on the `reason`, you can decide to throw an error (or prompt for a new password).
   *
   * @example
   * ```typescript
   * const doc2 = await PDFDocument.load(pdf, {
   *   onUserPassword: async (o) => {
   *     if (o) {
   *       throw new Error("Incorrect password");
   *     }
   *
   *     return "12345";
   *   },
   * });
   * ```
   */
  onUserPassword?: core.UserPasswordHandle;
  onCertificate?: core.CertificateHandle;
}

export type PDFDocumentCloneParams = copy.PDFCopierCreateParams &
  copy.PDFCopierAppendParams;

export class PDFDocument {
  #dss?: Dss;

  public readonly version: PDFVersion;
  public readonly pages: PDFPages;
  public readonly fonts: FontComponent[] = [];

  public comboBoxHandler: forms.IComboBoxHandler;
  public checkBoxHandler: forms.CheckBoxHandler;
  public textEditorHandler: forms.TextEditorHandler;
  public radioButtonHandler: forms.RadioButtonHandler;
  public signatureBoxHandler: forms.SignatureBoxHandler;
  public inputImageHandler: forms.InputImageBoxHandler;
  public certificateHandler: IPdfCertificateStorageHandler;

  /**
   * Creates PDF document
   * @param param Create PDF document parameters
   * @returns new PDF document
   */
  public static async create({
    version = PDFVersion.v2_0,
    useXrefTable = false,
    disableAscii85Encoding = false,
    disableCompressedStreams = false,
    disableCompressedObjects = false,
    ...others
  }: PDFDocumentCreateParameters = {}): Promise<PDFDocument> {
    const target = new core.PDFDocument();

    // Set options
    target.version = version;
    target.options.xref = useXrefTable
      ? core.XrefStructure.Table
      : core.XrefStructure.Stream;
    target.options.disableAscii85Encoding = disableAscii85Encoding;
    target.options.disableCompressedStreams = disableCompressedStreams;
    target.options.disableCompressedObjects = disableCompressedObjects;
    if (version < PDFVersion.v1_5) {
      target.options.xref = core.XrefStructure.Table;
    }

    if ("algorithm" in others) {
      if ("recipients" in others) {
        // Public Key Encryption
        target.encryptHandler = await core.PublicKeyEncryptionHandler.create({
          document: target,
          crypto: pkijs.getCrypto(true),
          ...others,
          algorithm: core.CryptoFilterMethods[
            others.algorithm
          ] as core.CryptoFilterMethods.AES128
        });
      } else {
        // Standard Encryption
        target.encryptHandler = await core.StandardEncryptionHandler.create({
          document: target,
          crypto: pkijs.getCrypto(true),
          ...others,
          algorithm: core.CryptoFilterMethods[
            others.algorithm
          ] as core.CryptoFilterMethods.AES128
        });
      }
    }

    target.update.addCatalog();

    return new PDFDocument(target);
  }

  public static async load(
    raw: string | BufferSource,
    params: PDFDocumentLoadParameters = {}
  ): Promise<PDFDocument> {
    if (typeof raw === "string") {
      raw = Convert.FromBinary(raw);
    }

    const target = await core.PDFDocument.fromPDF(raw);

    if (target.encryptHandler) {
      if (
        target.encryptHandler instanceof core.StandardEncryptionHandler &&
        params.onUserPassword
      ) {
        target.encryptHandler.onUserPassword = params.onUserPassword;
      }
      if (
        target.encryptHandler instanceof core.PublicKeyEncryptionHandler &&
        params.onCertificate
      ) {
        target.encryptHandler.onCertificate = params.onCertificate;
      }

      await target.decrypt();
    }

    await target.createUpdate();

    const doc = new PDFDocument(target);
    await doc.certificateHandler.load();

    return doc;
  }

  private constructor(public target: core.PDFDocument) {
    if (!target.update.catalog) {
      throw new Error("PDF document doesn't have Catalog object");
    }

    this.version = target.version;
    this.pages = new PDFPages(target.update.catalog.Pages, this);

    this.comboBoxHandler = new forms.ComboBoxHandler(this);
    this.checkBoxHandler = new forms.CheckBoxHandler(this);
    this.textEditorHandler = new forms.TextEditorHandler(this);
    this.radioButtonHandler = new forms.RadioButtonHandler(this);
    this.signatureBoxHandler = new forms.SignatureBoxHandler(this);
    this.inputImageHandler = new forms.InputImageBoxHandler(this);
    this.certificateHandler = new PDFCertificateStorageHandler(this);
  }

  public get dss(): Dss {
    if (!this.#dss) {
      this.#dss = Dss.get(this);
    }

    return this.#dss;
  }

  protected get catalog(): core.CatalogDictionary {
    const catalog = this.target.update.catalog;
    if (!catalog) {
      throw new Error("Cannot get Catalog from the PDF document.");
    }

    return catalog;
  }

  public addFont(font?: font.DefaultFonts | BufferSource): FontComponent {
    const fontComponent = FontComponent.addFont(this, font);

    this.fonts.push(fontComponent);

    return fontComponent;
  }

  public async save(): Promise<ArrayBuffer> {
    const raw = await this.target.toPDF();
    await this.target.createUpdate();

    return raw;
  }

  public createImage(imageRaw: BufferSource): Image {
    return Image.create(imageRaw, this);
  }

  public createWatermark(params: WatermarkParams): Watermark {
    return Watermark.create(params, this);
  }

  public getComponents(): ReadonlyArray<forms.IComponent> {
    const components: forms.IComponent[] = [];

    const acroForm = this.target.update.catalog?.AcroForm;

    if (acroForm && acroForm.has()) {
      const fields = acroForm.get().Fields;

      for (const field of fields) {
        if (field instanceof core.PDFDictionary && field.has("T")) {
          const pdfField = field.to(core.PDFField);

          try {
            const component = forms.FormComponentFactory.create(pdfField, this);
            components.push(component);
          } catch {
            // component not found or error occurred, continue searching
          }

          if (pdfField.has("Kids")) {
            const childComponents = this.searchNestedComponents(pdfField);
            components.push(...childComponents);
          }
        }
      }
    }

    return components;
  }

  private searchNestedComponents(
    parent: core.PDFDictionary
  ): forms.IComponent[] {
    if (!parent.has("Kids")) {
      return [];
    }

    const components: forms.IComponent[] = [];

    const kids = parent.get("Kids", core.PDFArray);

    for (const kid of kids) {
      if (kid instanceof core.PDFDictionary && kid.has("T")) {
        const pdfField = kid.to(core.PDFField);

        try {
          const component = forms.FormComponentFactory.create(pdfField, this);
          components.push(component);
        } catch {
          // component not found or error occurred, continue searching
        }

        if (pdfField.has("Kids")) {
          const childComponents = this.searchNestedComponents(pdfField);
          components.push(...childComponents);
        }
      }
    }

    return components;
  }

  public filterComponents<T extends forms.IComponent>(
    ...types: forms.IComponentConstructor<T>[]
  ): T[] {
    const components = this.getComponents();
    const filteredComponents: T[] = [];
    for (const component of components) {
      for (const type of types) {
        if (component instanceof type) {
          filteredComponents.push(component);
        }
      }
    }

    return filteredComponents;
  }

  public getComponentByName(name: string): forms.IComponent | null;
  public getComponentByName<T>(
    name: string,
    type: new (target: never, document: PDFDocument) => T
  ): T;
  public getComponentByName(
    name: string,
    type?: typeof WrapObject
  ): forms.IComponent | null {
    const acroForm = this.target.update.catalog?.AcroForm;
    let component: forms.IComponent | null = null;

    if (acroForm && acroForm.has()) {
      const fields = acroForm.get().Fields;
      for (const item of fields) {
        if (item instanceof core.PDFDictionary) {
          if (!item.has("T")) {
            // skip field without name
            continue;
          }

          const field = item.to(core.PDFField);
          const fullName = field.getFullName();

          if (fullName === name) {
            try {
              component = forms.FormComponentFactory.create(field, this);
            } catch {
              // nothing
            }
          } else if (field.has("Kids")) {
            component = this.searchNestedComponent(field, name, type);
          }

          // if component was found, then break the loop
          if (component) {
            break;
          }
        }
      }
    }

    if (type && !(component instanceof type)) {
      throw new TypeError(
        "Cannot get PDF Component from the Document. Component doesn't require to the requested type."
      );
    }

    return component;
  }

  private searchNestedComponent(
    parent: core.PDFDictionary,
    name: string,
    type?: typeof WrapObject
  ): forms.IComponent | null {
    if (!parent.has("Kids")) {
      return null;
    }
    const kids = parent.get("Kids", core.PDFArray);

    for (const kid of kids) {
      if (kid instanceof core.PDFDictionary) {
        if (!kid.has("T")) {
          // continue searching, because it's not a field
          continue;
        }
        const pdfField = kid.to(core.PDFField);
        const fullName = pdfField.getFullName();

        if (fullName === name) {
          try {
            const component = forms.FormComponentFactory.create(pdfField, this);

            return type
              ? component instanceof type
                ? component
                : null
              : component;
          } catch {
            // component not found or error occurred, continue searching
          }
        } else if (pdfField.has("Kids")) {
          const childComponent = this.searchNestedComponent(
            pdfField,
            name,
            type
          );
          if (childComponent) {
            return childComponent;
          }
        }
      }
    }

    return null;
  }

  public getComponentById(
    id: number,
    generation?: number
  ): forms.IComponent | null;
  public getComponentById<T>(
    id: number,
    generation: number,
    type: new (target: never, document: PDFDocument) => T
  ): T;
  public getComponentById(
    id: number,
    generation?: number,
    type?: typeof WrapObject
  ): forms.IComponent | null {
    let component: forms.IComponent | null = null;

    try {
      const obj = this.target.update.getObject(id, generation);
      const field = obj.value;

      if (field instanceof core.PDFDictionary) {
        component = forms.FormComponentFactory.create(field, this);
      }
    } catch {
      // nothing
    }

    if (type) {
      if (!(component instanceof type)) {
        throw new TypeError(
          "Cannot get PDF Component from the Document. Component doesn't require to the requested type."
        );
      }
    }

    return component;
  }

  public createForm(
    width: core.TypographySize,
    height: core.TypographySize
  ): FormObject {
    return FormObject.create(this, width, height);
  }

  public get isSigned(): boolean {
    const sig = this.getSignatures().find((o) => {
      if (o instanceof forms.SignatureBoxGroup) {
        return o.isSigned;
      }

      return o.findGroup()?.isSigned ?? false;
    });

    return !!sig;
  }

  public getSignatures(): Array<forms.SignatureBoxGroup | forms.SignatureBox> {
    const signatures = this.filterComponents<
      forms.SignatureBoxGroup | forms.SignatureBox
    >(forms.SignatureBoxGroup, forms.SignatureBox);

    return signatures;
  }

  public async sign(
    params: PDFDocumentSignParameters
  ): Promise<forms.SignatureBoxGroup> {
    let group: forms.SignatureBoxGroup | null = null;
    if (params.groupName) {
      // get signature filed
      const component = this.getComponentByName(params.groupName);
      if (component instanceof forms.SignatureBoxGroup) {
        group = component;
      }
      if (component instanceof forms.SignatureBox) {
        group = component.findGroup();
      }
    }
    if (!group) {
      // create hidden signature box and add it to the first page
      const page = this.pages.get(0);
      const box = page.addSignatureBox({
        groupName: params.groupName
      });

      group = box.findGroup();
    }
    if (!group) {
      throw new Error("Cannot get Signature filed for signing.");
    }

    return group.sign(params);
  }

  public async verify(
    params?: forms.SignatureBoxGroupVerifyParams
  ): Promise<DocumentHandlerVerifyResult> {
    const result: DocumentHandlerVerifyResult = {
      err: null,
      items: []
    };

    for (const signature of this.getSignatures()) {
      const signatureResult = await signature.verify(params);
      result.items.push(signatureResult);
    }

    return result;
  }

  /**
   * Clones the current document
   * @param params Parameters for the new document
   * @returns
   */
  public async clone(
    params: PDFDocumentCloneParams = {}
  ): Promise<PDFDocument> {
    const copier = await copy.PDFCopier.create(params);

    copier.append(this.target, params);

    return new PDFDocument(copier.document);
  }

  #embeddedFiles?: EmbeddedFileMap;

  /**
   * Gets embedded files
   */
  public get embeddedFiles(): EmbeddedFileMap {
    if (!this.#embeddedFiles) {
      this.#embeddedFiles = new EmbeddedFileMap(this.catalog, this);
    }

    return this.#embeddedFiles;
  }

  /**
   * Checks if the document has hybrid reference
   * @returns True if the document has hybrid reference, otherwise false
   */
  hasHybridReference(): boolean {
    let update: core.PDFDocumentUpdate | null = this.target.update;

    while (update) {
      if (!(update.xref instanceof core.CrossReferenceTable)) {
        return false;
      }

      if (update.xref.xrefStream) {
        return true;
      }

      update = update.previous;
    }

    return false;
  }
}
