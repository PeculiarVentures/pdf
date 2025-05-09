export * from "./cms";
export * from "./WrapObject";
export * from "./forms/CheckBox.Handler";
export * from "./Version";
export * from "./Document";
export * from "./Image";
export * from "./Pages";
export * from "./Page";
export * from "./ResourceManager";
export * from "./forms/SignatureBox.Handler";
export * from "./forms/TextEditor.Handler";
export * from "./forms/InputImageBox.Handler";
export * from "./Font";
export * from "./FontDescriptor";
export * from "./Dss";
export * from "./CertificateStorageHandler";
export * from "./embedded_file";
export * from "./forms";

import { Registry } from "./Registry";
import { CRL } from "./cms/CRL";
import { OCSP } from "./cms/OCSP";

const registry = Registry.getInstance();
registry.register("OCSP", OCSP);
registry.register("CRL", CRL);
