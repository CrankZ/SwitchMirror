import React, {useEffect, useState} from "react";
import type {RadioChangeEvent} from "antd";
import {Input, Radio, Space, Spin} from "antd";
import {readFileFromAppConfig, writeFileToAppConfig} from "./fileUtils.ts";
import {homeDir} from "@tauri-apps/api/path";

/**
 * https://rsproxy.cn/
 * https://mirrors.tuna.tsinghua.edu.cn/help/crates.io-index/
 */
const Rust: React.FC = () => {
  const [customUrl, setCustomUrl] = useState("");
  const [disabled, setDisabled] = useState(true);

  const mavenOptions = [
    {
      label: "无",
      value: "none",
      url: "",
    },
    {
      label: "RsProxy（字节）",
      value: "RsProxy",
      url: "sparse+https://rsproxy.cn/index/",
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

  const [isLoading, setLoading] = useState(true);
  const [value, setValue] = useState("");
  const [rustConfigFile, setRustConfigFile] = useState("");

  function extractRegistryUrl(
    configText: string,
    sectionName: string,
  ): string | null {
    const regex = new RegExp(
      `\\[${sectionName}\\][\\s\\S]*?registry\\s*=\\s*"([^"]+)"`,
    );
    const match = configText.match(regex);
    return match ? match[1] : null;
  }

  const initRadio = async () => {
    try {
      const homeDirPath = await homeDir();
      setRustConfigFile(homeDirPath + "/.cargo/config");

      const fileContent = await readFileFromAppConfig(
        homeDirPath + "/.cargo/config",
      );
      let url = extractRegistryUrl(fileContent, "source.mirror");

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

  function removeSectionsFromConfig(
    configText: string,
    sectionNames: string[],
  ): string {
    let modifiedConfigText = configText;
    for (const sectionName of sectionNames) {
      const regex = new RegExp(`\\[${sectionName}\\][\\s\\S]*?(?=\\[|$)`, "g");
      modifiedConfigText = modifiedConfigText.replace(regex, "");
    }
    return modifiedConfigText;
  }

  const configText = `[source.crates-io]\nreplace-with = 'mirror'\n[source.mirror]\nregistry = "{mirror}"`;
  const sectionNames = ["source.crates-io", "source.mirror"];

  function replace(text: string, url: string): string {
    const modifiedConfigText = removeSectionsFromConfig(text, sectionNames);
    const mirrorText = configText.replace("{mirror}", url);
    if (modifiedConfigText.trim() == "") {
      return `${mirrorText}`;
    }
    return `${modifiedConfigText}\n${mirrorText}`;
  }

  useEffect(() => {
    const modifiedConfigText = removeSectionsFromConfig(
      configText,
      sectionNames,
    );
    console.log(modifiedConfigText);

    initRadio().then(() => {
      setLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <Spin tip="Loading">
        <div className="content" />
      </Spin>
    );
  }

  async function writeUrlToFile(url: string) {
    let text = await readFileFromAppConfig(rustConfigFile);
    const replacedText = await replace(text, url);
    writeFileToAppConfig(rustConfigFile, replacedText);
  }

  const onChange = async (e: RadioChangeEvent) => {
    let checkedValue = e.target.value;
    setValue(checkedValue);

    if (mavenOptions[0].value === checkedValue) {
      const text = await readFileFromAppConfig(rustConfigFile);
      if (text && text != "") {
        const replacedText = removeSectionsFromConfig(text, sectionNames);
        writeFileToAppConfig(rustConfigFile, replacedText);
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
      await writeUrlToFile(checkedOption.url as string);
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

export default Rust;
