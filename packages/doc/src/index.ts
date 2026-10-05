export * as cms from "./cms";
export * from "./cms";
export * from "./WrapObject";
export * from "./Version";
export * from "./Document";
export * from "./Image";
export * from "./Pages";
export * from "./Page";
export * from "./ResourceManager";
export * as Font from "./Font";
export * from "./Font";
export * from "./FontDescriptor";
export * from "./Dss";
export * from "./CertificateStorageHandler";
export * from "./embedded_file";
export * as forms from "./forms";
export * from "./forms";
export * from "./Watermark";
export * from "./WrapContentObject";
export * from "./FormObject";

import { Registry } from "./Registry";
import { CRL } from "./cms/CRL";
import { OCSP } from "./cms/OCSP";

const registry = Registry.getInstance();
registry.register("OCSP", OCSP);
registry.register("CRL", CRL);
