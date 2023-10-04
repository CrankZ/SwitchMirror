import React, { useEffect, useState } from "react";
import type { RadioChangeEvent } from "antd";
import { Input, Radio, Space } from "antd";
import { readFileFromAppConfig, writeFileToAppConfigXml } from "./fileUtils.ts";
import { XmlUtils } from "./XMLUtil.ts";
import { homeDir } from "@tauri-apps/api/path";

const Maven: React.FC = () => {
  const [customUrl, setCustomUrl] = useState("");
  const [disabled, setDisabled] = useState(true);

  const mavenOptions = [
    {
      label: "无",
      value: "none",
      url: "",
    },
    {
      label: "阿里云",
      value: "aliyun",
      url: "https://maven.aliyun.com/repository/public",
    },
    {
      label: "华为云",
      value: "huaweiCloud",
      url: "https://repo.huaweicloud.com/repository/maven",
    },
    {
      label: (
        <Space>
          自定义
          <Input
            disabled={disabled}
            defaultValue={customUrl}
            onChange={(e) => {
              if (value == mavenOptions[mavenOptions.length - 1].value) {
                setCustomUrl(e.target.value);
                writeUrlToFile("custom", e.target.value);
              }
            }}
          ></Input>
        </Space>
      ),
      value: "custom",
      url: { customUrl },
    },
  ];

  const [value, setValue] = useState("");

  const [mavenConfigFile, setMavenConfigFile] = useState("");

  useEffect(() => {
    const readConfigFile = async () => {
      try {
        const homeDirPath = await homeDir();
        setMavenConfigFile(homeDirPath + "/.m2/settings.xml");

        const fileContent = await readFileFromAppConfig(
          homeDirPath + "/.m2/settings.xml",
        );
        let url = await XmlUtils.extractName(fileContent);

        const option = mavenOptions.find(
          (option) =>
            option.url != mavenOptions[0].url &&
            option.url != mavenOptions[mavenOptions.length - 1].url &&
            (option.url == url || option.url + "/" == url),
        );

        if (url && !option) {
          setValue(mavenOptions[mavenOptions.length - 1].value);
          setCustomUrl(url);
          setDisabled(false);
          return;
        }

        if (!option) {
          setValue(mavenOptions[0].value);
          return;
        }

        setValue(option?.value as string);
      } catch (error) {
        console.error("Error reading file:", error);
      }
    };

    readConfigFile();
  }, []);

  async function writeUrlToFile(name: string, url: string) {
    let text = await readFileFromAppConfig(mavenConfigFile);
    if (text == "") {
      text =
        '<?xml version="1.0" encoding="UTF-8"?><settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd"><mirrors></mirrors></settings>';
    }
    const replacedText = await XmlUtils.replaceMavenUrl(text, name, url);
    writeFileToAppConfigXml(mavenConfigFile, replacedText);
  }

  const onChange = async (e: RadioChangeEvent) => {
    let checkedValue = e.target.value;
    setValue(checkedValue);

    if (mavenOptions[0].value === checkedValue) {
      const text = await readFileFromAppConfig(mavenConfigFile);
      if (text && text != "") {
        const replacedText = await XmlUtils.replaceMavenNone(text);
        writeFileToAppConfigXml(mavenConfigFile, replacedText);
      }
      return;
    }

    setDisabled(true);
    if (mavenOptions[mavenOptions.length - 1].value === checkedValue) {
      setDisabled(false);
      return;
    }

    const checkedOption = mavenOptions.find(
      (option) => option.value === checkedValue,
    );
    if (checkedOption) {
      await writeUrlToFile(checkedValue, checkedOption.url as string);
    }
  };

  return (
    <>
      <Radio.Group
        onChange={onChange}
        name="radiogroup"
        options={mavenOptions}
        defaultValue={value}
        value={value}
      ></Radio.Group>
      <br />
    </>
  );
};

export default Maven;
