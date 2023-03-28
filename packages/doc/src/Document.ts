import * as core from "@peculiarventures/pdf-core";
import * as font from "@peculiarventures/pdf-font";
import * as copy from "@peculiarventures/pdf-copy";
import { PublicKeyPermissionFlags } from "@peculiarventures/pdf-core";
import { X509Certificate } from "@peculiar/x509";
import { BufferSource, Convert } from "pvtsutils";
import * as pkijs from "pkijs";
import { CheckBoxHandler } from "./CheckBoxHandler";
import { Image } from "./Image";
import { SignatureBoxHandler } from "./SignatureBoxHandler";
import { PDFPages } from "./Pages";
import { RadioButtonHandler } from "./RadioButtonHandler";
import { TextEditorHandler } from "./TextEditorHandler";
import { FormComponentFactory, IComponent, IComponentConstructor, SignatureBoxGroup, SignatureBoxSignParameters, SignatureVerifyResult, SignatureBox, SignatureBoxGroupVerifyParams } from "./Form";
import { InputImageBoxHandler } from "./InputImageBoxHandler";
import { FontComponent } from "./Font";
import { Watermark, WatermarkParams } from "./Watermark";
import { FormObject } from "./FormObject";
import { WrapObject } from "./WrapObject";
import { Dss } from "./Dss";
import { IPdfCertificateStorageHandler, PDFCertificateStorageHandler } from "./CertificateStorageHandler";
import { EmbeddedFileMap } from "./embedded_file";
import { ComboBoxHandler, IComboBoxHandler } from "./forms";

export enum PDFVersion {
  v1_1 = 1.1,
  v1_2 = 1.2,
  v1_3 = 1.3,
  v1_4 = 1.4,
  v1_5 = 1.5,
  v1_6 = 1.6,
  v1_7 = 1.7,
  v2_0 = 2.0,
}

export interface DocumentHandlerVerifyResult {
  err: null | Error;
  items: SignatureVerifyResult[];
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

export interface StandardEncryptionParameters extends core.StandardEncryptionHandlerCreateCommonParams {
  algorithm: keyof typeof core.CryptoFilterMethods;
}

export interface PublicKeyEncryptionParameters {
  permission?: PublicKeyPermissionFlags;
  encryptMetadata?: boolean;
  algorithm: keyof typeof core.CryptoFilterMethods;
  recipients: X509Certificate[];
}

export type PDFDocumentCreateParameters = PDFDocumentCreateCommonParameters |
  (PDFDocumentCreateCommonParameters & StandardEncryptionParameters) |
  (PDFDocumentCreateCommonParameters & PublicKeyEncryptionParameters);

export interface PDFDocumentSignParameters extends SignatureBoxSignParameters {
  groupName?: string;
}

export interface PDFDocumentLoadParameters {
  onUserPassword?: core.UserPasswordHandle;
  onCertificate?: core.CertificateHandle;
}

export type PDFDocumentCloneParams = copy.PDFCopierCreateParams & copy.PDFCopierAppendParams;

export class PDFDocument {

  #dss?: Dss;

  public readonly version: PDFVersion;
  public readonly pages: PDFPages;
  public readonly fonts: FontComponent[] = [];

  public comboBoxHandler: IComboBoxHandler;
  public checkBoxHandler: CheckBoxHandler;
  public textEditorHandler: TextEditorHandler;
  public radioButtonHandler: RadioButtonHandler;
  public signatureBoxHandler: SignatureBoxHandler;
  public inputImageHandler: InputImageBoxHandler;
  public certificateHandler: IPdfCertificateStorageHandler;
  public crypto: Crypto;

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
    target.options.xref = useXrefTable ? core.XrefStructure.Table : core.XrefStructure.Stream;
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
          algorithm: core.CryptoFilterMethods[others.algorithm] as core.CryptoFilterMethods.AES128,
        });
      } else {
        // Standard Encryption
        target.encryptHandler = await core.StandardEncryptionHandler.create({
          document: target,
          crypto: pkijs.getCrypto(true),
          ...others,
          algorithm: core.CryptoFilterMethods[others.algorithm] as core.CryptoFilterMethods.AES128,
        });
      }
    }

    target.update.addCatalog();

    return new PDFDocument(target);
  }

  public static async load(raw: string | BufferSource, params: PDFDocumentLoadParameters = {}): Promise<PDFDocument> {
    if (typeof raw === "string") {
      raw = Convert.FromBinary(raw);
    }

    const target = await core.PDFDocument.fromPDF(raw);

    if (target.encryptHandler) {
      if (target.encryptHandler instanceof core.StandardEncryptionHandler && params.onUserPassword) {
        target.encryptHandler.onUserPassword = params.onUserPassword;
      }
      if (target.encryptHandler instanceof core.PublicKeyEncryptionHandler && params.onCertificate) {
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

    this.comboBoxHandler = new ComboBoxHandler(this);
    this.checkBoxHandler = new CheckBoxHandler(this);
    this.textEditorHandler = new TextEditorHandler(this);
    this.radioButtonHandler = new RadioButtonHandler(this);
    this.signatureBoxHandler = new SignatureBoxHandler(this);
    this.inputImageHandler = new InputImageBoxHandler(this);
    this.certificateHandler = new PDFCertificateStorageHandler(this);
    this.crypto = pkijs.getCrypto(true).crypto;
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
    return FontComponent.addFont(this, font);
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

  public getComponents(): ReadonlyArray<IComponent> {
    const components: IComponent[] = [];

    const forms = this.target.update.catalog?.AcroForm;

    if (forms && forms.has()) {
      const fields = forms.get().Fields;
      for (const item of fields) {
        if (item instanceof core.PDFDictionary) {
          const field = item.to(core.PDFField);

          try {
            const component = FormComponentFactory.create(field, this);
            components.push(component);
          } catch {
            // nothing
          }
        }
      }
    }

    return components;
  }

  public filterComponents<T extends IComponent>(...types: IComponentConstructor<T>[]): T[] {
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

  public getComponentByName(name: string): IComponent | null;
  public getComponentByName<T>(name: string, type: new (target: any, document: PDFDocument) => T): T | null;
  public getComponentByName(name: string, type?: typeof WrapObject): IComponent | WrapObject<any> | null {
    const forms = this.target.update.catalog?.AcroForm;
    let component: IComponent | null = null;

    if (forms && forms.has()) {
      const fields = forms.get().Fields;
      for (const item of fields) {
        if (item instanceof core.PDFDictionary) {
          const field = item.to(core.PDFField);

          try {
            const component2 = FormComponentFactory.create(field, this);
            if (component2.name === name) {
              component = component2;
              break;
            }
          } catch {
            // nothing
          }
        }
      }
    }

    if (type) {
      if (!(component instanceof type)) {
        throw new TypeError("Cannot get PDF Component from the Document. Component doesn't require to the requested type.");
      }
    }

    return component;
  }

  public getComponentById(id: number, generation?: number): IComponent | null;
  public getComponentById<T>(id: number, generation: number, type: new (target: any, document: PDFDocument) => T): T | null;
  public getComponentById(id: number, generation?: number, type?: typeof WrapObject): IComponent | WrapObject<any> | null {
    let component: IComponent | null = null;

    try {
      const obj = this.target.update.getObject(id, generation);
      const field = obj.value;

      if (field instanceof core.PDFDictionary) {
        component = FormComponentFactory.create(field, this);
      }
    } catch {
      // nothing
    }

    if (type) {
      if (!(component instanceof type)) {
        throw new TypeError("Cannot get PDF Component from the Document. Component doesn't require to the requested type.");
      }
    }

    return component;
  }

  public createForm(width: core.TypographySize, height: core.TypographySize): FormObject {
    return FormObject.create(this, width, height);
  }

  public get isSigned(): boolean {
    const acroForm = this.target.update.catalog?.AcroForm;

    return !!(acroForm && acroForm.has() && acroForm.get().SigFlags);
  }

  public getSignatures(): Array<SignatureBoxGroup | SignatureBox> {
    const signatures = this.filterComponents<SignatureBoxGroup | SignatureBox>(SignatureBoxGroup, SignatureBox);

    return signatures;
  }

  public async sign(params: PDFDocumentSignParameters): Promise<SignatureBoxGroup> {
    let group: SignatureBoxGroup | null = null;
    if (params.groupName) {
      // get signature filed
      group = this.getComponentByName(params.groupName, SignatureBoxGroup);
    }
    if (!group) {
      // create hidden signature box and add it to the first page
      const page = this.pages.get(0);
      const box = page.addSignatureBox({
        groupName: params.groupName,
      });

      group = box.findGroup();
    }
    if (!group) {
      throw new Error("Cannot get Signature filed for signing.");
    }

    return group.sign(params);
  }

  public async verify(params?: SignatureBoxGroupVerifyParams): Promise<DocumentHandlerVerifyResult> {
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
  public async clone(params: PDFDocumentCloneParams = {}): Promise<PDFDocument> {
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


}
