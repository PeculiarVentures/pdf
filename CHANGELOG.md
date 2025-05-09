# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.17.2](https://github.com/PeculiarVentures/pdf/compare/v1.17.1...v1.17.2) (2025-05-06)


### Bug Fixes

* enhance border and background color handling in ComboBoxHandler ([4f4c030](https://github.com/PeculiarVentures/pdf/commit/4f4c030e42a82c258c5ea9efd6e5cc1d064aa6c0))
* fix background color and border properties in TextEditor ([8988b29](https://github.com/PeculiarVentures/pdf/commit/8988b291832f8b548a77d9edb30c83c33e24d5e9))
* update border width conversion in TextEditorHandler ([e4e3ee6](https://github.com/PeculiarVentures/pdf/commit/e4e3ee65a2b2e450a946495ab8c38c49a335e8c9))





## [1.17.1](https://github.com/PeculiarVentures/pdf/compare/v1.17.0...v1.17.1) (2025-05-05)


### Bug Fixes

* handle case where leaf certificate is trusted in CertificateChain ([5b0d94c](https://github.com/PeculiarVentures/pdf/commit/5b0d94c3f6e7a0dea8b5d8e3d12c71a17b382463))
* improve LTV state handling in signature verification process for trusted leaf certificate ([c92ab13](https://github.com/PeculiarVentures/pdf/commit/c92ab138132e965ec30e5fa5a324d7fc3b33196e))





# [1.17.0](https://github.com/PeculiarVentures/pdf/compare/v1.16.0...v1.17.0) (2025-01-07)


### Bug Fixes

* **cms:** improve signing algorithm handling in OCSP response ([6ddfbaf](https://github.com/PeculiarVentures/pdf/commit/6ddfbaf3cb0d7b9b008bc2040f52fba7a26adcf6))
* **doc:** improve wording for identity verification and document structure warnings ([52cb7af](https://github.com/PeculiarVentures/pdf/commit/52cb7afdfc69197f6f9e42971d545d2f765bd2af))
* **doc:** update default xref option to 0 for XRef Stream ([cf115bc](https://github.com/PeculiarVentures/pdf/commit/cf115bc9764562f99f0d2eb7b007952568676cff))
* **forms:** implement paint call on border and color change events ([9b98eee](https://github.com/PeculiarVentures/pdf/commit/9b98eee3bd90d299ce07cbc74f126455a751ec02))
* implement Registry class for managing circular dependencies and enhance CMS imports ([c5cd79b](https://github.com/PeculiarVentures/pdf/commit/c5cd79b0364a1b198ae128799d81688410dd40a1))
* update repo-init action to use NPM token instead of GitHub token ([7267dc2](https://github.com/PeculiarVentures/pdf/commit/7267dc2c0bb977fd2bb174f48ee67848fcff869d))


### Features

* **doc:** add catalog getter with error handling in PDFDocument ([7a1e043](https://github.com/PeculiarVentures/pdf/commit/7a1e0435814d8136f453514b8cafe835b3c4fecc))
* **doc:** enable signature flags in AcroForm for PDFPage ([ad910e7](https://github.com/PeculiarVentures/pdf/commit/ad910e757d0b036cf5172e2f5977451df6da0495))
* **forms:** add name parameter to IFormComponentParameters and improve FormComponent structure ([9822cde](https://github.com/PeculiarVentures/pdf/commit/9822cde2acf80072d074dd935b5ed3f525208caa))
* **tests:** add password parameter to PdfRenderingHelper load and getPageHash methods ([1acc968](https://github.com/PeculiarVentures/pdf/commit/1acc968473de1569c6ec4f7bf33ab5c73207face))
* **tests:** add PDF testing utilities and helpers ([8911ac5](https://github.com/PeculiarVentures/pdf/commit/8911ac5e2c87661a122b1a8d11148cea235e8268))
* **tests:** add PKI handling and PDF file writing utilities ([d088f1c](https://github.com/PeculiarVentures/pdf/commit/d088f1c54710d7d598b0df4ee2ea601db20f9b37))
* **tests:** enhance PdfRenderingHelper and add resource handling ([f3c41b7](https://github.com/PeculiarVentures/pdf/commit/f3c41b78f3701344e1b2d3c34b3048a427d4bc9d))
* **ViewWriter:** add toString method to convert buffer to binary string ([c471b75](https://github.com/PeculiarVentures/pdf/commit/c471b759415e049d96bb760bb72f1cb8ee8a6b9e))





# [1.16.0](https://github.com/PeculiarVentures/pdf/compare/v1.15.0...v1.16.0) (2024-07-22)


### Features

* Add RSA-PSS signature algorithm support ([8f194b1](https://github.com/PeculiarVentures/pdf/commit/8f194b18161b55879593e6b0c6dbd49ea10d04bf))
* Support RSA-PSS algorithm parameters ([51c2273](https://github.com/PeculiarVentures/pdf/commit/51c2273ce1dbbf73f43fd84b340afd2692b8f2ea))





# [1.15.0](https://github.com/PeculiarVentures/pdf/compare/v1.14.0...v1.15.0) (2024-06-03)


### Bug Fixes

* Update type declaration for TS v5 ([d087096](https://github.com/PeculiarVentures/pdf/commit/d087096c1b413134a9bb8ed5d648bf5c1b3ce313))


### Features

* Update CryptoEngine to support Ed25519 type ([ca62bcf](https://github.com/PeculiarVentures/pdf/commit/ca62bcf50cf194f93bc04cdf35ee866501bc4e79))





# [1.14.0](https://github.com/PeculiarVentures/pdf/compare/v1.13.18...v1.14.0) (2024-01-19)


### Bug Fixes

* EOF handling in PDFDocumentUpdate ([d53cfcc](https://github.com/PeculiarVentures/pdf/commit/d53cfcc28171918a65cc63f0e16941c7fc7a35b1))
* incorrect wrongStructure calculation ([1d13857](https://github.com/PeculiarVentures/pdf/commit/1d13857fa6837e4a434c35eba33a327c3457f888))


### Features

* formatting issue in SignatureBoxGroup class ([b53ce8d](https://github.com/PeculiarVentures/pdf/commit/b53ce8dfe83617a115063874f2cf4c2c559c3de6))





## [1.13.18](https://github.com/PeculiarVentures/pdf/compare/v1.13.17...v1.13.18) (2024-01-16)


### Bug Fixes

* issue [#115](https://github.com/PeculiarVentures/pdf/issues/115) ([91c238b](https://github.com/PeculiarVentures/pdf/commit/91c238b78ad9f710bae42fbd28229e70162ccca7))





## [1.13.17](https://github.com/PeculiarVentures/pdf/compare/v1.13.16...v1.13.17) (2024-01-04)


### Bug Fixes

* error if xref table eol includes the SPACE char ([4942598](https://github.com/PeculiarVentures/pdf/commit/4942598b28bb12ba48206baf314c6b7d80b9cd43))
* improve error message for ParsingError ([1fb04c8](https://github.com/PeculiarVentures/pdf/commit/1fb04c89118538750dfc1fe2f620c1c82a3708d2))





## [1.13.16](https://github.com/PeculiarVentures/pdf/compare/v1.13.15...v1.13.16) (2024-01-03)


### Bug Fixes

* improve BadCharError message ([15c5136](https://github.com/PeculiarVentures/pdf/commit/15c513678de9ff0aef971f60c9c0db8fa7ff910e))
* improve PDF Dictionary value conversion error ([f08bd8f](https://github.com/PeculiarVentures/pdf/commit/f08bd8facf4f535bd0a3726d1ce2d17f7db497e5))
* incorrect type for ID field of Page Object ([5d49348](https://github.com/PeculiarVentures/pdf/commit/5d49348d5bc8ac622d0cb87199eb5295c2e3e310))





## [1.13.15](https://github.com/PeculiarVentures/pdf/compare/v1.13.14...v1.13.15) (2023-12-07)


### Bug Fixes

* paint for TextEditor ([6c698ee](https://github.com/PeculiarVentures/pdf/commit/6c698ee959cc0a06d6fd0e29d54b739167b6af76))
* read CrossReferenceTable ([72e4d55](https://github.com/PeculiarVentures/pdf/commit/72e4d5567bf5739d3d7fcd0f03eaaf2a2bc0fb31))
* read stream value ([10eaab0](https://github.com/PeculiarVentures/pdf/commit/10eaab0f86024978184ba916ec0fa88338f3af08))





## [1.13.14](https://github.com/PeculiarVentures/pdf/compare/v1.13.13...v1.13.14) (2023-11-07)


### Bug Fixes

* cross-reference stream index count ([a5867b4](https://github.com/PeculiarVentures/pdf/commit/a5867b487e1eb8b4e291567e3e841769ef5a7b4a))





## [1.13.13](https://github.com/PeculiarVentures/pdf/compare/v1.13.12...v1.13.13) (2023-10-03)

**Note:** Version bump only for package pdf





## [1.13.12](https://github.com/PeculiarVentures/pdf/compare/v1.13.11...v1.13.12) (2023-09-14)


### Bug Fixes

* begin update with end of line if needed ([5aa651b](https://github.com/PeculiarVentures/pdf/commit/5aa651b67b33e988eae7d5b5dd86b1c70570157a))
* enable cache to reduce value conversion ([3e7a8ac](https://github.com/PeculiarVentures/pdf/commit/3e7a8ac3c75d85647c51528d6300c0de14004872))
* incorrect trailer size ([72eb6af](https://github.com/PeculiarVentures/pdf/commit/72eb6af6986dd9c2e7832169d2339e76391b562e)), closes [#102](https://github.com/PeculiarVentures/pdf/issues/102)





## [1.13.11](https://github.com/PeculiarVentures/pdf/compare/v1.13.10...v1.13.11) (2023-09-14)


### Bug Fixes

* macos Viewer doesn't show aes256 encrypted document ([d7b952f](https://github.com/PeculiarVentures/pdf/commit/d7b952f0adf9c2f0d6270a534439e97c8218417d)), closes [#99](https://github.com/PeculiarVentures/pdf/issues/99)





## [1.13.10](https://github.com/PeculiarVentures/pdf/compare/v1.13.9...v1.13.10) (2023-08-28)


### Bug Fixes

* use User password for Owner if Owner is empty ([6d6f692](https://github.com/PeculiarVentures/pdf/commit/6d6f692f028f769bc68109ac731096cb293c13ab))





## [1.13.9](https://github.com/PeculiarVentures/pdf/compare/v1.13.8...v1.13.9) (2023-08-23)


### Bug Fixes

* incorrect stream cloning ([e3d1531](https://github.com/PeculiarVentures/pdf/commit/e3d15310098cd840f3099154c730159b9695928f))





## [1.13.8](https://github.com/PeculiarVentures/pdf/compare/v1.13.7...v1.13.8) (2023-08-22)


### Bug Fixes

* error on AcroForm getting ([9cf0890](https://github.com/PeculiarVentures/pdf/commit/9cf0890852689a1eb5a838d2cf80acc74e57d70e))
* incorrect caching of indexes during cloning ([cde3b39](https://github.com/PeculiarVentures/pdf/commit/cde3b39b6410920ee17e5fa9e6e2f44932ddc794))





## [1.13.7](https://github.com/PeculiarVentures/pdf/compare/v1.13.6...v1.13.7) (2023-08-10)


### Bug Fixes

* AcroFrom duplicates Fields on addField ([f9d5950](https://github.com/PeculiarVentures/pdf/commit/f9d595026e698a6b31f0753db9b4082da9dc346f))
* error in component getting by name if Kid is not a field ([824492c](https://github.com/PeculiarVentures/pdf/commit/824492cbf7f62b2a10760d3c2f7729fa2a40263b))
* error on Signature field splitting if it doesn't belong to parent field ([0197121](https://github.com/PeculiarVentures/pdf/commit/01971212900b4b6ab96cec957e43fa3f557161cc))
* fix error with incorrect cache map ([bd96819](https://github.com/PeculiarVentures/pdf/commit/bd96819838f6ae561634145d59e3804918845cf0)), closes [#94](https://github.com/PeculiarVentures/pdf/issues/94)
* improve Signature.groupName renaming and add tests ([8c82fd3](https://github.com/PeculiarVentures/pdf/commit/8c82fd3166703d10659c8fc9d3edf91513da9b83))
* increase speed of serialization ([449bf26](https://github.com/PeculiarVentures/pdf/commit/449bf26e15c5e422c76221a45684452331ef0111))
* problems with signature groups ([bab4d06](https://github.com/PeculiarVentures/pdf/commit/bab4d06d6c354ad235f0a592450f95972b3546cb))
* remove Widget from AcroFrom on `split` ([071d28e](https://github.com/PeculiarVentures/pdf/commit/071d28ec8cd213165055a119b705c88fd210a9df))
* remove XFA on copy ([33273ff](https://github.com/PeculiarVentures/pdf/commit/33273ff1484599bab98b7df9c44237cbba23dc46))





## [1.13.6](https://github.com/PeculiarVentures/pdf/compare/v1.13.5...v1.13.6) (2023-06-29)


### Bug Fixes

* use components to get isSigned ([0917550](https://github.com/PeculiarVentures/pdf/commit/091755068ef6b1cd2af842eff68cd2fec9d5eded))





## [1.13.5](https://github.com/PeculiarVentures/pdf/compare/v1.13.4...v1.13.5) (2023-06-29)


### Bug Fixes

* incorrect signature removing ([5c60716](https://github.com/PeculiarVentures/pdf/commit/5c60716223caa59bb6c9caddc7d4743e21a33352))





## [1.13.4](https://github.com/PeculiarVentures/pdf/compare/v1.13.3...v1.13.4) (2023-06-22)


### Bug Fixes

* error on null cloning ([1eb6339](https://github.com/PeculiarVentures/pdf/commit/1eb6339850c8def04e82571bb58b955fca269911)), closes [#88](https://github.com/PeculiarVentures/pdf/issues/88)
* sig doesn't draw an image for Widget + Field ([4ae6bee](https://github.com/PeculiarVentures/pdf/commit/4ae6bee6563bf4d97d2e7e662380dd618ce0b8c7))





## [1.13.3](https://github.com/PeculiarVentures/pdf/compare/v1.13.2...v1.13.3) (2023-06-15)


### Bug Fixes

* split single widget for signature box ([364fd5d](https://github.com/PeculiarVentures/pdf/commit/364fd5d3e91eba76493051e625df516581504f21))





## [1.13.2](https://github.com/PeculiarVentures/pdf/compare/v1.13.1...v1.13.2) (2023-06-15)


### Bug Fixes

* don't run setter if value is the same for groupName ([d7bf4f1](https://github.com/PeculiarVentures/pdf/commit/d7bf4f1ed833cea27287ce78025bd9598cac4599))





## [1.13.1](https://github.com/PeculiarVentures/pdf/compare/v1.13.0...v1.13.1) (2023-06-14)


### Bug Fixes

* return info about changed indexes after doc cloning ([bca6679](https://github.com/PeculiarVentures/pdf/commit/bca667985dd626b0f3ceb2872a77fd469d568c12))





# [1.13.0](https://github.com/PeculiarVentures/pdf/compare/v1.12.0...v1.13.0) (2023-06-14)


### Bug Fixes

* Can't sign document with visual annotation ([1d890dd](https://github.com/PeculiarVentures/pdf/commit/1d890dd5a68e926fc3d74f887def4accf84c513c)), closes [#75](https://github.com/PeculiarVentures/pdf/issues/75)
* CheckBox sets V into Widget ([57dd535](https://github.com/PeculiarVentures/pdf/commit/57dd535c0e1ac96c29a96a1bf420c2610934217d))
* incorrect XRef decoding ([d3e2ec4](https://github.com/PeculiarVentures/pdf/commit/d3e2ec468f4c631e78aa80d69d602b9a8437ea2b))
* isSigned returns incorrect result ([8b99611](https://github.com/PeculiarVentures/pdf/commit/8b99611a6397efa343f619bd6e357810ff3a8fbd))
* minor issues ([462c2c4](https://github.com/PeculiarVentures/pdf/commit/462c2c42c76a3fc8f0e7dd00905bf3b30a7025e3))
* recursive error ([e026393](https://github.com/PeculiarVentures/pdf/commit/e026393a34a2d2d1b6805ce1e29932389657e706))
* return white color for empty arrays ([03ff8c5](https://github.com/PeculiarVentures/pdf/commit/03ff8c5cfc187c64d6d7b007d47f7ba19c420167))
* text field with multiple widgets ([cbea2bf](https://github.com/PeculiarVentures/pdf/commit/cbea2bf6dd34e84d31c8cf690fcac03c4f5cc37c)), closes [#73](https://github.com/PeculiarVentures/pdf/issues/73)
* unable to change width for widget ([c31a2ed](https://github.com/PeculiarVentures/pdf/commit/c31a2ed1cd463a41714a70c3451bccfd7a114e91)), closes [#76](https://github.com/PeculiarVentures/pdf/issues/76)
* use CharacterEncodingDictionary [#80](https://github.com/PeculiarVentures/pdf/issues/80) ([abb92cb](https://github.com/PeculiarVentures/pdf/commit/abb92cb1cd1a550c6d56cfe7278a3d7803b68dd8))


### Features

* compute font size for TextEditor ([58da52d](https://github.com/PeculiarVentures/pdf/commit/58da52dc74b5e2af1789085a066983a279dbd967))
* support hybrid xref reading [#78](https://github.com/PeculiarVentures/pdf/issues/78) ([12aa11c](https://github.com/PeculiarVentures/pdf/commit/12aa11c28f1df0e69a1baba16409fcc9c45bff2b))





# [1.12.0](https://github.com/PeculiarVentures/pdf/compare/v1.11.3...v1.12.0) (2023-06-01)


### Features

* support page padding ([1f827da](https://github.com/PeculiarVentures/pdf/commit/1f827da4959708a8efa1b80d124f29b5ba935a9c))





## [1.11.3](https://github.com/PeculiarVentures/pdf/compare/v1.11.2...v1.11.3) (2023-05-08)


### Bug Fixes

* incorrect BBox when changing Y coordinate ([9cb56a2](https://github.com/PeculiarVentures/pdf/commit/9cb56a21f0036ebd87e6f370267687d08e697ebc))





## [1.11.2](https://github.com/PeculiarVentures/pdf/compare/v1.11.1...v1.11.2) (2023-05-05)


### Bug Fixes

* app doesn't draw Appearance content for multiple updates ([810c44a](https://github.com/PeculiarVentures/pdf/commit/810c44a2a110a05739d0794c5056ab191b628f9a))
* getComponentByName with argument type can't return null ([93f4f21](https://github.com/PeculiarVentures/pdf/commit/93f4f21fc1e7c9b45f4a3656f5daaa9e19e409c1))
* Is not works content alignment for render ([5d017f2](https://github.com/PeculiarVentures/pdf/commit/5d017f2ada100356944eea2b7599de6f6fe41214)), closes [#62](https://github.com/PeculiarVentures/pdf/issues/62)
* Unable to set value for Radio widget ([d156dbe](https://github.com/PeculiarVentures/pdf/commit/d156dbeb994d6ed666a2cf8fabf1eebb84f8ac1f)), closes [#61](https://github.com/PeculiarVentures/pdf/issues/61)





## [1.11.1](https://github.com/PeculiarVentures/pdf/compare/v1.11.0...v1.11.1) (2023-05-05)


### Bug Fixes

* enable support for text widgets in nested Fields ([#56](https://github.com/PeculiarVentures/pdf/issues/56)) ([10fb372](https://github.com/PeculiarVentures/pdf/commit/10fb37268cc7262f0fddff9a476247ae30a515e1))
* Wrong appearance for Comb text fields ([abb65ec](https://github.com/PeculiarVentures/pdf/commit/abb65ecb64b0546dbb74fc59ae19e970e9d24d30)), closes [#60](https://github.com/PeculiarVentures/pdf/issues/60)





# [1.11.0](https://github.com/PeculiarVentures/pdf/compare/v1.10.4...v1.11.0) (2023-03-30)


### Bug Fixes

* problem with wrapWidget usage ([7a73765](https://github.com/PeculiarVentures/pdf/commit/7a7376526c852766718f9e51cebad0b178cd29e1))


### Features

* add Choice dictionary ([fa41dce](https://github.com/PeculiarVentures/pdf/commit/fa41dce8f5f21cc037f10cd91cb7b65e38d5c660))
* add clear method to Array ([62a02ab](https://github.com/PeculiarVentures/pdf/commit/62a02ab84baef0377a76d2dbd475f83cd41a4e21))
* add ComboBox ([b7057bf](https://github.com/PeculiarVentures/pdf/commit/b7057bf68818787f7ac5b52b026a2b6baf377271))
* add form-json package ([f7447b7](https://github.com/PeculiarVentures/pdf/commit/f7447b79c94e6bdc660e5dcd243c15138dd9c7df))





## [1.10.4](https://github.com/PeculiarVentures/pdf/compare/v1.10.3...v1.10.4) (2023-03-15)


### Bug Fixes

* circular dependencies ([#51](https://github.com/PeculiarVentures/pdf/issues/51)) ([b887268](https://github.com/PeculiarVentures/pdf/commit/b887268a2777da7fa5f30f0931a527a3a7415fa4))





## [1.10.3](https://github.com/PeculiarVentures/pdf/compare/v1.10.2...v1.10.3) (2023-03-14)


### Bug Fixes

* rollup error and update project dependencies ([#50](https://github.com/PeculiarVentures/pdf/issues/50)) ([7111e61](https://github.com/PeculiarVentures/pdf/commit/7111e6152f07cffc485ec5bfce154b2800d360fe))





## [1.10.2](https://github.com/PeculiarVentures/pdf/compare/v1.10.1...v1.10.2) (2023-03-14)


### Bug Fixes

* Hancock files ([#49](https://github.com/PeculiarVentures/pdf/issues/49)) ([78d9180](https://github.com/PeculiarVentures/pdf/commit/78d91803ba016e7ee2cf650cf02019f5fc04cba5))





## [1.10.1](https://github.com/PeculiarVentures/pdf/compare/v1.10.0...v1.10.1) (2023-03-08)


### Bug Fixes

* Support TrueType font ([#48](https://github.com/PeculiarVentures/pdf/issues/48)) ([aa43a72](https://github.com/PeculiarVentures/pdf/commit/aa43a72c53da1f6dc25cb7106fb6219f6485594b)), closes [#47](https://github.com/PeculiarVentures/pdf/issues/47)





# [1.10.0](https://github.com/PeculiarVentures/pdf/compare/v1.9.0...v1.10.0) (2023-03-01)


### Features

* file attachment ([#46](https://github.com/PeculiarVentures/pdf/issues/46)) ([7cd5df0](https://github.com/PeculiarVentures/pdf/commit/7cd5df0ab9a4c06eb8a77a7b99e8b7687f935b75))





# [1.9.0](https://github.com/PeculiarVentures/pdf/compare/v1.8.5...v1.9.0) (2023-02-24)


### Features

* Page management ([#45](https://github.com/PeculiarVentures/pdf/issues/45)) ([d6140bc](https://github.com/PeculiarVentures/pdf/commit/d6140bc8f0d118592acce2af1740e1f0cc4a9534))





## [1.8.5](https://github.com/PeculiarVentures/pdf/compare/v1.8.4...v1.8.5) (2023-02-09)


### Bug Fixes

* font adding, incorrect Tj operator ([#42](https://github.com/PeculiarVentures/pdf/issues/42)) ([366e02e](https://github.com/PeculiarVentures/pdf/commit/366e02e5fce5059a1e15cad5813a5a465572a444))





## [1.8.4](https://github.com/PeculiarVentures/pdf/compare/v1.8.3...v1.8.4) (2023-02-09)

**Note:** Version bump only for package pdf





## [1.8.3](https://github.com/PeculiarVentures/pdf/compare/v1.8.2...v1.8.3) (2023-02-08)


### Bug Fixes

* incorrect encryption for Sig, Dict fields and Array items ([#40](https://github.com/PeculiarVentures/pdf/issues/40)) ([5f09f85](https://github.com/PeculiarVentures/pdf/commit/5f09f85c36c08d626e00a6e2aec4f8dc9cad7f57))





## [1.8.2](https://github.com/PeculiarVentures/pdf/compare/v1.8.1...v1.8.2) (2023-02-08)


### Bug Fixes

* signature verification ([#39](https://github.com/PeculiarVentures/pdf/issues/39)) ([39630f4](https://github.com/PeculiarVentures/pdf/commit/39630f43cc35bdb192aea5ac93c2261d9904c98c))





## [1.8.1](https://github.com/PeculiarVentures/pdf/compare/v1.8.0...v1.8.1) (2023-02-06)


### Bug Fixes

* incorrect content on signing ([#38](https://github.com/PeculiarVentures/pdf/issues/38)) ([c3b1b3a](https://github.com/PeculiarVentures/pdf/commit/c3b1b3a5d7061640d943455285c5211bac67ccea))





# [1.8.0](https://github.com/PeculiarVentures/pdf/compare/v1.7.1...v1.8.0) (2023-02-03)


### Features

* Document clone ([#37](https://github.com/PeculiarVentures/pdf/issues/37)) ([ffaa1b7](https://github.com/PeculiarVentures/pdf/commit/ffaa1b74506dae2665fe98c9d81ea67f9ab5d18b))





## [1.7.1](https://github.com/PeculiarVentures/pdf/compare/v1.7.0...v1.7.1) (2023-01-31)


### Bug Fixes

* Add RC4 for Standard Encryption ([#36](https://github.com/PeculiarVentures/pdf/issues/36)) ([99d0f08](https://github.com/PeculiarVentures/pdf/commit/99d0f08b037e3f1d88007231a967ca2e21328d7e))





# [1.7.0](https://github.com/PeculiarVentures/pdf/compare/v1.6.7...v1.7.0) (2023-01-31)


### Features

* Public Key encryption ([#35](https://github.com/PeculiarVentures/pdf/issues/35)) ([0763e20](https://github.com/PeculiarVentures/pdf/commit/0763e20dc9973d101c97e46a2b496b8ed09d2e06))





## [1.6.7](https://github.com/PeculiarVentures/pdf/compare/v1.6.6...v1.6.7) (2023-01-24)


### Bug Fixes

* verification reason ([#34](https://github.com/PeculiarVentures/pdf/issues/34)) ([e5eb8c9](https://github.com/PeculiarVentures/pdf/commit/e5eb8c93432372f499cebfc02e2bebac5e87fc97))





## [1.6.6](https://github.com/PeculiarVentures/pdf/compare/v1.6.5...v1.6.6) (2023-01-24)


### Bug Fixes

* add state for malformed CMS ([14fa460](https://github.com/PeculiarVentures/pdf/commit/14fa460dd6ac0d441249130f84e4a2daf96a13d6))





## [1.6.5](https://github.com/PeculiarVentures/pdf/compare/v1.6.4...v1.6.5) (2023-01-23)

**Note:** Version bump only for package pdf





## [1.6.4](https://github.com/PeculiarVentures/pdf/compare/v1.6.3...v1.6.4) (2023-01-22)


### Bug Fixes

* sign encrypted document ([#27](https://github.com/PeculiarVentures/pdf/issues/27)) ([1d7aa90](https://github.com/PeculiarVentures/pdf/commit/1d7aa9015af00ebc14700ee4352b82b49d36493d))





## [1.6.3](https://github.com/PeculiarVentures/pdf/compare/v1.6.2...v1.6.3) (2023-01-22)


### Bug Fixes

* **core:** Page inheritance ([#26](https://github.com/PeculiarVentures/pdf/issues/26)) ([c2b4cfc](https://github.com/PeculiarVentures/pdf/commit/c2b4cfc14344731c2a6fa0d58d1e276a4b646885)), closes [#21](https://github.com/PeculiarVentures/pdf/issues/21)





## [1.6.2](https://github.com/PeculiarVentures/pdf/compare/v1.6.1...v1.6.2) (2023-01-22)

**Note:** Version bump only for package pdf





## [1.6.1](https://github.com/PeculiarVentures/pdf/compare/v1.6.0...v1.6.1) (2023-01-22)

**Note:** Version bump only for package pdf





# [1.6.0](https://github.com/PeculiarVentures/pdf/compare/v1.5.2...v1.6.0) (2023-01-22)


### Features

* Encryption ([#23](https://github.com/PeculiarVentures/pdf/issues/23)) ([2966abc](https://github.com/PeculiarVentures/pdf/commit/2966abc9978d52ceb055488e743070998512af67))





## [1.5.2](https://github.com/PeculiarVentures/pdf/compare/v1.5.1...v1.5.2) (2023-01-17)


### Bug Fixes

* error on AP getting for TextEdit ([7e5575c](https://github.com/PeculiarVentures/pdf/commit/7e5575cc7895a53d44300541cba9eb7825a197a8))





## [1.5.1](https://github.com/PeculiarVentures/pdf/compare/v1.5.0...v1.5.1) (2023-01-15)


### Bug Fixes

* incorrect result for FormComponent.left ([7efdca6](https://github.com/PeculiarVentures/pdf/commit/7efdca646b4cb31830def56b6a81fa198fd71210))





# [1.5.0](https://github.com/PeculiarVentures/pdf/compare/v1.4.0...v1.5.0) (2022-12-27)


### Bug Fixes

* error on null object getting [#14](https://github.com/PeculiarVentures/pdf/issues/14) ([a049632](https://github.com/PeculiarVentures/pdf/commit/a0496325ecf5808847bc849bf82b88c218579a03))


### Features

* add stopPropagation for CertificateStorage IResult ([bcdb90a](https://github.com/PeculiarVentures/pdf/commit/bcdb90a85a94696b6ef993f84bcc5851008b2006))
* use params for verify ([faceb75](https://github.com/PeculiarVentures/pdf/commit/faceb754dd8782df89d5d10a0fe74b97fd4eda8a))





# [1.4.0](https://github.com/PeculiarVentures/pdf/compare/v1.3.0...v1.4.0) (2022-12-05)


### Features

* improve PageTreeNode ([28bc6d3](https://github.com/PeculiarVentures/pdf/commit/28bc6d35e811e03b48c621309d80b0f2b393ae29)), closes [#12](https://github.com/PeculiarVentures/pdf/issues/12)





# [1.3.0](https://github.com/PeculiarVentures/pdf/compare/v1.2.3...v1.3.0) (2022-11-30)


### Bug Fixes

* **cli:** error on getEngine ([1ceb0fe](https://github.com/PeculiarVentures/pdf/commit/1ceb0fe8aa86cdcb3e48493f700b191f408f2490))
* **doc:** problems with getEngine ([518444a](https://github.com/PeculiarVentures/pdf/commit/518444a9ff90d0698089dd7edbed06cfc785b85b))
* TS errors after tsc update ([f2f332a](https://github.com/PeculiarVentures/pdf/commit/f2f332a275f112a7382ed99c09588a488dc868b4))


### Features

* **core:** support Lock Dictionary ([6b030ea](https://github.com/PeculiarVentures/pdf/commit/6b030eaa8d87136f11e775cf128f0adf2f425001))
* use pkijs TS beta version ([a26bf46](https://github.com/PeculiarVentures/pdf/commit/a26bf46d1e179866efb0cbc9fd254d61ccb616f7))





## [1.2.3](https://github.com/PeculiarVentures/pdf/compare/v1.2.2...v1.2.3) (2022-03-07)


### Bug Fixes

* incorrect id for braipoolP512r1 curve ([2fff41a](https://github.com/PeculiarVentures/pdf/commit/2fff41a86e74c4d427fa7e38a334e569416b7c7e))





## [1.2.2](https://github.com/PeculiarVentures/pdf/compare/v1.2.1...v1.2.2) (2022-03-04)


### Bug Fixes

* ESM module with require statement ([4af13f0](https://github.com/PeculiarVentures/pdf/commit/4af13f0f821a68eecc171f6c092bec3e4d699255))





## [1.2.1](https://github.com/PeculiarVentures/pdf/compare/v1.2.0...v1.2.1) (2022-03-04)


### Bug Fixes

* error on edwords curves usage ([da59fdf](https://github.com/PeculiarVentures/pdf/commit/da59fdf41437804bed4a5f240f4b29cbca52564f))





# [1.2.0](https://github.com/PeculiarVentures/pdf/compare/v1.1.4...v1.2.0) (2022-02-28)


### Bug Fixes

* Incorrect Date regular expresion ([7a81575](https://github.com/PeculiarVentures/pdf/commit/7a81575f182901ff63a8ce3c9f332faf92d5bc9e))


### Features

* Support new ECC and Hash mechanisms ([ba71c82](https://github.com/PeculiarVentures/pdf/commit/ba71c82b110d28f2b208f12f4f72164ebfecc9cd))





## [1.1.4](https://github.com/PeculiarVentures/pdf/compare/v1.1.3...v1.1.4) (2022-02-16)


### Bug Fixes

* Error on padded header parsing ([c9c1d5b](https://github.com/PeculiarVentures/pdf/commit/c9c1d5b7ec973990835446e73cfea61c2a1198dd))
* Error on padded xref table ([9839135](https://github.com/PeculiarVentures/pdf/commit/98391352c7711ae6a539e4c8995b19717b5e84bf))





## [1.1.3](https://github.com/PeculiarVentures/pdf/compare/v1.1.2...v1.1.3) (2022-02-16)


### Bug Fixes

* Enable LTV sate if VRI is null and revocations present ([ef6eb51](https://github.com/PeculiarVentures/pdf/commit/ef6eb516cad33956241a7fd67a245853214159ba))





## [1.1.2](https://github.com/PeculiarVentures/pdf/compare/v1.1.1...v1.1.2) (2022-02-10)


### Bug Fixes

* Add signedData object to verification result ([b152155](https://github.com/PeculiarVentures/pdf/commit/b152155e310fa8fa4f945f65d44302ae35e276cd))
* Type declaration ([37e2de6](https://github.com/PeculiarVentures/pdf/commit/37e2de6ef309635df301643e3dadacd64ad479f5))





## [1.1.1](https://github.com/PeculiarVentures/pdf/compare/v1.1.0...v1.1.1) (2022-02-08)


### Bug Fixes

* Incorrect import order for DefaultCertificateStorageHandler ([e6b70f1](https://github.com/PeculiarVentures/pdf/commit/e6b70f16783cbec64e54e7c9d5b91d564f37f5db))
* multiple pkijs import ([4f88151](https://github.com/PeculiarVentures/pdf/commit/4f8815175cdee94d5731070859f59d184edcbb99))





# [1.1.0](https://github.com/PeculiarVentures/pdf/compare/v1.0.11...v1.1.0) (2022-01-27)


### Bug Fixes

* **cms:** Error on certs getting ([a423350](https://github.com/PeculiarVentures/pdf/commit/a42335050df329135b62efc93b0160dafaab53c2))
* Error on bad encoded revocation items ([5483508](https://github.com/PeculiarVentures/pdf/commit/54835080d2c50c5195a860524ce640689c71ea90))
* Export ICertificateStorageHandler ([51d66d5](https://github.com/PeculiarVentures/pdf/commit/51d66d5df54fc83622b97703c450aa7637a52629))
* findCRL always returns null ([fa601df](https://github.com/PeculiarVentures/pdf/commit/fa601df23b498459dbbd1ee887fd9a5bbed9dc9b))
* Incorrect signature name for encrypted PDF ([7d49501](https://github.com/PeculiarVentures/pdf/commit/7d49501fbae4bac97c794726421c619c9dc36ebe))


### Features

* Add info about LTV status disabling ([8af682f](https://github.com/PeculiarVentures/pdf/commit/8af682f45783788a83bca6cbb2757d319568e7e4))
* Add wrongStructure field to PDFDocument ([4641ffa](https://github.com/PeculiarVentures/pdf/commit/4641ffac1d6301d13ff0052dc8d55e4b26a9ae66))
* **cms:** Improve chain validation ([bcc5dc1](https://github.com/PeculiarVentures/pdf/commit/bcc5dc14107960e473a2f72e31f6d4daf46cc940))





## 1.0.11 (2022-01-13)

**Note:** Version bump only for package pdf
