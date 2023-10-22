import { FormatterUtil } from "./FormatterUtil.ts";

export class XmlUtils {
  static async removeXMLComments(xmlText: string): Promise<string> {
    const regex = /<!--(.*?)-->/gs;
    return xmlText.replace(regex, "");
  }

  static async extractName(str: string): Promise<string> {
    const cleanXml = await XmlUtils.removeXMLComments(str);
    const regex = /<url>(.*?)<\/url>/;
    const match = cleanXml.match(regex);
    return match ? match[1] : "";
  }

  static async replaceMavenUrl(
    settings: string,
    name: string,
    url: string,
  ): Promise<string> {
    const mirror = `<mirror><id>${name}</id><mirrorOf>*</mirrorOf><name>${name}</name><url>${url}</url></mirror>`;
    return await XmlUtils.replaceMaven(settings, mirror);
  }

  static async replaceMavenNone(settings: string): Promise<string> {
    return await XmlUtils.replaceMaven(settings, ``);
  }

  static async replaceMaven(settings: string, mirror: string): Promise<string> {
    const regex = /<mirrors>[\s\S]*<\/mirrors>/;
    let replace = settings.replace(regex, `<mirrors>${mirror}</mirrors>`);
    return await FormatterUtil.format(replace);
  }
}
