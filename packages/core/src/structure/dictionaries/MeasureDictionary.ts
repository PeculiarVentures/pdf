import {
  PDFArray,
  PDFArrayField,
  PDFDictionary,
  PDFDictionaryField,
  PDFNumberField,
  PDFNameField,
  PDFTextString,
  PDFTextStringField
} from "../../objects";

export class MeasureDictionary extends PDFDictionary {
  public static readonly TYPE = "PtData";
  public static readonly SUBTYPE = "Cloud";

  /**
   * The type of PDF object that this dictionary describes; shall be Measure for a point data dictionary
   */
  @PDFNameField("Type", true, MeasureDictionary.TYPE)
  public type!: typeof MeasureDictionary.TYPE;

  /**
   * Shall be Cloud
   * @remarks PDF 2.0
   */
  @PDFNameField("Subtype", true, MeasureDictionary.SUBTYPE)
  public subtype!: typeof MeasureDictionary.SUBTYPE;

  protected override onCreate(): void {
    super.onCreate();

    this.type = MeasureDictionary.TYPE;
    this.subtype = MeasureDictionary.SUBTYPE;
  }
}

export class RectilinearMeasureDictionary extends MeasureDictionary {
  /**
   * A text string expressing the scale ratio of the drawing in the region
   * corresponding to this dictionary. Universally recognised unit abbreviations
   * should be used, either matching those of the number format arrays in this
   * dictionary or those of commonly used scale ratios.
   */
  @PDFTextStringField("R")
  public r!: PDFTextString;

  /**
   * A number format array for measurement of change along the x axis
   * and, if Y is not present, along the y axis as well. The first element in the array
   * shall contain the scale factor for converting from default user space units to the
   * largest units in the measuring coordinate system along that axis.
   * The directions of the x and y axes are in the measuring coordinate system and
   * are independent of the page rotation. These directions shall be determined by
   * the BBox entry of the containing viewport (see "Table 265: Entries in a viewport
   * dictionary").
   */
  @PDFArrayField("X")
  public x!: PDFArray;

  /**
   * A number format array for measurement of change along the y axis. The first
   * element in the array shall contain the scale factor for converting from default
   * user space units to the largest units in the measuring coordinate system along
   * the y axis.
   * @remarks Required when the x and y scales have different units or conversion factors
   */
  @PDFArrayField("Y", true)
  public y!: PDFArray | null;

  /**
   * A number format array for measurement of distance in any direction.
   * The first element in the array shall specify the conversion to the largest distance
   * unit from units represented by the first element in X. The scale factors from X, Y
   * (if present) and CYX (if Y is present) shall be used to convert from default user
   * space to the appropriate units before applying the distance function.
   */
  @PDFArrayField("D")
  public d!: PDFArray;

  /**
   * A number format array for measurement of area. The first element in
   * the array shall specify the conversion to the largest area unit from units
   * represented by the first element in X, squared. The scale factors from X, Y (if
   * present) and CYX (if Y is present) shall be used to convert from default user
   * space to the appropriate units before applying the area function.
   */
  @PDFArrayField("A")
  public a!: PDFArray;

  /**
   * A number format array for measurement of angles. The first element
   * in the array shall specify the conversion to the largest angle unit from degrees.
   * The scale factor from CYX (if present) shall be used to convert from default user
   * space to the appropriate units before applying the angle function.
   */
  @PDFArrayField("T", true)
  public t!: PDFArray | null;

  /**
   * A number format array for measurement of the slope of a line. The
   * first element in the array shall specify the conversion to the largest slope unit
   * from units represented by the first element in Y divided by the first element in X.
   * The scale factors from X, Y (if present) and CYX (if Y is present) shall be used to
   * convert from default user space to the appropriate units before applying the
   * slope function.
   */
  @PDFArrayField("S", true)
  public s!: PDFArray | null;

  /**
   * An array of two numbers that shall specify the origin of the
   * measurement coordinate system in default user space coordinates. The
   * directions by which x and y increase in value from this origin shall be
   * determined by the viewport’s BBox entry (see "Table 265: Entries in a viewport
   * dictionary").
   *
   * Default value: the first coordinate pair (lower-left corner) of the rectangle
   * specified by the viewport’s BBox entry.
   */
  @PDFArrayField("O", true)
  public o!: PDFArray | null;

  /**
   * A factor that shall be used to
   * convert the largest units along the y axis to the largest units along the x axis. It
   * shall be used for calculations (distance, area, and angle) where the units are be
   * equivalent; if not specified, these calculations may not be performed (which
   * would be the case in situations such as x representing time and y representing
   * temperature). Other calculations (change in x, change in y, and slope) shall not
   * require this value.
   * @remarks Meaningful only when Y is present
   */
  @PDFNumberField("CYX", true)
  public cyx!: number | null;

  protected override onCreate(): void {
    super.onCreate();

    const document = this.getDocument();

    this.r = document.createString("");
    this.x = document.createArray();
    this.d = document.createArray();
    this.a = document.createArray();
  }
}

export class GeospatialMeasureDictionary extends MeasureDictionary {
  /**
   * An array of numbers that shall be taken pairwise to define a series
   * of points that describes the bounds of an area for which geospatial transformations
   * are valid.
   *
   * For maps, this bounding polygon is known as a neatline. These numbers are
   * expressed relative to a unit square that describes the BBox associated with a
   * Viewport or Form XObject, or the bounds of an Image XObject. If not present, the
   * default values shall define a rectangle describing the full unit square, with values of
   * [0.0 0.0 0.0 1.0 1.0 1.0 1.0 0.0].
   * @note The polygon description need not be explicitly closed by repeating the
   * first point values as a final point.
   * @remarks PDF 2.0
   */
  @PDFArrayField("Bounds", true)
  public bounds!: PDFArray | null;

  /**
   * A projected or geographic coordinate system dictionary
   * @remarks PDF 2.0
   */
  @PDFDictionaryField({
    name: "GCS"
  })
  public gcs!: PDFDictionary;

  /**
   * A projected or geographic coordinate system that shall be used for
   * the display of position values, such as latitude and longitude. Formatting the
   * displayed representation of these values is controlled by the interactive PDF
   * processor.
   * @remarks PDF 2.0
   */
  @PDFDictionaryField({
    name: "DCS",
    optional: true
  })
  public dcs!: PDFDictionary | null;

  /**
   * Preferred Display Units. An array of three names that identify in
   * order a linear display unit, an area display unit, and an angular display unit.
   *
   * The following are valid linear display units:
   * - M a metre
   * - KM a kilometre
   * - FT an international foot
   * - USFT a U.S. Survey foot
   * - MI an international mile
   * - NM an international nautical mile
   *
   * The following are valid area display units:
   * - SQM a square metre
   * - HA a hectare (10,000 square metres)
   * - SQKM a square kilometre
   * - SQFT a square foot (US Survey)
   * - A an acre
   * - SQMI a square mile (international)
   *
   * The following are valid angular display units:
   * - DEG a degree
   * - GRD a grad (1/400 of a circle, or 0.9 degrees)
   * @remarks PDF 2.0
   */
  @PDFArrayField("PDU", true)
  public pdu!: PDFArray | null;

  /**
   * An array of numbers that shall be taken pairwise, defining points
   * in geographic space as degrees of latitude and longitude, respectively when defining a
   * geographic coordinate system. These values shall be based on the geographic
   * coordinate system described in the GCS dictionary. When defining a projected
   * coordinate system, this array contains values in a planar projected coordinate space
   * as eastings and northings. For Geospatial3D, when Geospatial feature information is
   * present (requirement type Geospatial3D) in a 3D annotation, the GPTS array is
   * required to hold 3D point coordinates as triples rather than pairwise where the third
   * value of each tripe is an elevation value.
   * @remarks PDF 2.0
   * @note Any projected coordinate system includes an underlying geographic
   * coordinate system.
   */
  @PDFArrayField("GPTS")
  public gpts!: PDFArray;

  /**
   * An array of numbers that shall be taken pairwise to define points
   * in a 2D unit square. The unit square is mapped to the rectangular bounds of the
   * Viewport, image XObject, or forms XObject that contains the measure dictionary. This
   * array shall contain the same number of number pairs as the GPTS array; each
   * number pair is the unit square object position corresponding to the geospatial
   * position in the GPTS array. For Geospatial3D, when Geospatial feature information
   * is present in a 3D annotation (requirement type Geospatial3D), the LPTS array is
   * required to hold 3D point coordinates as triples corresponding to the GPTS array in
   * the 3D annotation view world coordinate space.
   * @remarks PDF 2.0
   */
  @PDFArrayField("LPTS", true)
  public lpts!: PDFArray | null;

  /**
   * A 12-element transformation matrix of real numbers, defining the
   * transformation from Xobject position coordinates to projected coordinate system.
   * If GCS specifies GCS (geographical) then PCSM should be ignored and always
   * used GPTS. If PCSM is present, it has priority over GPTS, and GPTS values may be
   * ignored. This priority provides backward compatibility.
   *
   * PCSM acronym = "Projected Coordinate System Matrix"
   * @remarks PDF 2.0
   */
  @PDFArrayField("PCSM", true)
  public pcsm!: PDFArray | null;

  protected override onCreate(): void {
    super.onCreate();

    const document = this.getDocument();

    this.gcs = document.createDictionary();
    this.gpts = document.createArray();
  }
}

export class MeasureFactory {
  public static items = new Map<string, typeof MeasureDictionary>([
    [RectilinearMeasureDictionary.SUBTYPE, RectilinearMeasureDictionary],
    [GeospatialMeasureDictionary.SUBTYPE, GeospatialMeasureDictionary]
  ]);

  public static register(
    subtype: string,
    value: typeof MeasureDictionary
  ): void {
    this.items.set(subtype, value);
  }

  public static get(subtype: string): typeof MeasureDictionary {
    const value = this.items.get(subtype);
    if (!value) {
      return MeasureDictionary;
    }

    return value;
  }
}
