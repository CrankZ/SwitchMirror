import xmlFormat from "xml-formatter";

export class FormatterUtil {
  static format(content: string) {
    return xmlFormat(content, { indentation: "  ", collapseContent: true });

    // return prettier.format(content, {
    //   semi: false,
    //   parser: "babel",
    //   plugins: [prettierPluginBabel, prettierPluginEstree],
    // });
  }
}
