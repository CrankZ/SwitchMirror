import React, { useEffect, useState } from "react";
import type { RadioChangeEvent } from "antd";
import { Input, Radio, Space, Spin } from "antd";
import { Command } from "@tauri-apps/api/shell";
import { platform } from "@tauri-apps/api/os";

const Npm: React.FC = () => {
  const [customUrl, setCustomUrl] = useState<string>("");
  const [disabled, setDisabled] = useState<boolean>(true);

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

  const [isLoading, setLoading] = useState(true);

  const [value, setValue] = useState<string>("");
  const [url, setUrl] = useState<string>("");

  async function getNpmProgram() {
    const platformName = await platform();
    return /^win/i.test(platformName) ? "run-npm.cmd" : "run-npm";
  }

  function getUrl(): Promise<string> {
    return new Promise<string>(async (resolve) => {
      const platformName = await platform();
      const program = /^win/i.test(platformName) ? "run-npm-cmd" : "run-npm";
      const command = new Command(program, ["config", "get", "registry"]);
      let url = "";

      command.stdout.on("data", (line) => {
        url = line;
      });

      command.on("close", () => {
        resolve(url);
        setUrl(url);
      });

      command.spawn();
    });
  }

  async function writeUrlToFile(url: string) {
    const program = await getNpmProgram();
    const command = new Command(program, ["config", "set", "registry", url]);
    await command.spawn();
  }

  const initRadio = () => {
    const option = npmOptions.find(
      (option) =>
        option.url != npmOptions[0].url &&
        option.url != npmOptions[npmOptions.length - 1].url &&
        (option.url == url || option.url + "/" == url),
    );

    if (url && !option) {
      if (url.includes("https://registry.npmjs.org")) {
        setValue(npmOptions[0].value);
        return;
      }
      setValue(npmOptions[npmOptions.length - 1].value);
      setCustomUrl(url as string);
      setDisabled(false);
      return;
    }

    if (!option) {
      setValue(npmOptions[0].value);
      return;
    }

    setValue(option?.value as string);
  };

  useEffect(() => {
    getUrl().then(() => {
      setLoading(false);
    });
    initRadio();
  }, [url]);

  if (isLoading) {
    return (
      <Spin tip="Loading">
        <div className="content" />
      </Spin>
    );
  }

  const onChange = async (e: RadioChangeEvent) => {
    let checkedValue = e.target.value;
    setValue(checkedValue);

    if (npmOptions[0].value === checkedValue) {
      if (url && url != "") {
        await writeUrlToFile("");
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
