import React, { useEffect, useState } from "react";
import type { RadioChangeEvent } from "antd";
import { Input, Radio, Space } from "antd";
import { readFileFromAppConfig, writeFileToAppConfig } from "./fileUtils.ts";
import { XmlUtils } from "./XMLUtil.ts";
import { homeDir } from "@tauri-apps/api/path";

const Npm: React.FC = () => {
  const [customUrl, setCustomUrl] = useState("");
  const [disabled, setDisabled] = useState(true);

  const npmOptions = [
    {
      label: "无",
      value: "none",
      url: "",
    },
    {
      label: "阿里云",
      value: "aliyun",
      url: "https://registry.npmmirror.com",
    },
    {
      label: "华为云",
      value: "huaweiCloud",
      url: "https://repo.huaweicloud.com/repository/npm",
    },
    {
      label: (
        <Space>
          自定义
          <Input
            disabled={disabled}
            defaultValue={customUrl}
            value={customUrl}
            onChange={(e) => {
              if (value == npmOptions[npmOptions.length - 1].value) {
                setCustomUrl(e.target.value);
                writeUrlToFile(e.target.value);
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

  const [npmConfigFile, setNpmConfigFile] = useState("");

  useEffect(() => {
    const readConfigFile = async () => {
      try {
        const homeDirPath = await homeDir();
        setNpmConfigFile(homeDirPath + ".npmrc");

        const fileContent = await readFileFromAppConfig(homeDirPath + ".npmrc");
        const url = await XmlUtils.extractRegistry(fileContent);

        const option = npmOptions.find(
          (option) =>
            option.url != npmOptions[0].url &&
            option.url != npmOptions[npmOptions.length - 1].url &&
            (option.url == url || option.url + "/" == url),
        );

        if (url && !option) {
          setValue(npmOptions[npmOptions.length - 1].value);
          setCustomUrl(url);
          setDisabled(false);
          return;
        }

        if (!option) {
          setValue(npmOptions[0].value);
          return;
        }

        setValue(option?.value as string);
      } catch (error) {
        console.error("Error reading file:", error);
      }
    };

    readConfigFile();
  }, []);

  async function writeUrlToFile(url: string) {
    let text = await readFileFromAppConfig(npmConfigFile);
    const replacedText = await XmlUtils.replaceRegistry(text, url);
    writeFileToAppConfig(npmConfigFile, replacedText);
  }

  const onChange = async (e: RadioChangeEvent) => {
    let checkedValue = e.target.value;
    setValue(checkedValue);

    if (npmOptions[0].value === checkedValue) {
      const text = await readFileFromAppConfig(npmConfigFile);
      if (text && text != "") {
        const replacedText = await XmlUtils.removeRegistryLine(text);
        writeFileToAppConfig(npmConfigFile, replacedText);
      }
      return;
    }

    const checkedOption = npmOptions.find(
      (option) => option.value === checkedValue,
    );
    setDisabled(true);
    if (checkedOption == npmOptions[npmOptions.length - 1]) {
      setDisabled(false);
      return;
    }
    if (checkedOption) {
      await writeUrlToFile(checkedOption.url as string);
    }
  };

  return (
    <>
      <Radio.Group
        onChange={onChange}
        name="radiogroup"
        options={npmOptions}
        defaultValue={value}
        value={value}
      ></Radio.Group>
      <br />
    </>
  );
};

export default Npm;
