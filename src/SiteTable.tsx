import React, { useEffect, useState } from "react";
import { Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import Maven from "./Maven.tsx";
import { open } from "@tauri-apps/api/shell";
import Npm from "./Npm.tsx";
import { homeDir } from "@tauri-apps/api/path";

interface DataType {
  key: React.Key;
  site: string;
  mirrors: React.ReactNode;
  action: React.ReactNode;
}

const columns: ColumnsType<DataType> = [
  {
    title: "站点",
    dataIndex: "site",
    render: (text: string) => <label>{text}</label>,
  },
  {
    title: "镜像",
    dataIndex: "mirrors",
  },
  {
    title: "操作",
    dataIndex: "action",
  },
];

const SiteTable: React.FC = () => {
  const [mavenConfigPath, setMavenConfigPath] = useState("");
  const [mavenConfigFile, setMavenConfigFile] = useState("");
  const [npmConfigPath, setNpmConfigPath] = useState("");
  const [npmConfigFile, setNpmConfigFile] = useState("");

  useEffect(() => {
    const readConfigFile = async () => {
      try {
        let homeDirPath = await homeDir();

        setMavenConfigPath(homeDirPath + ".m2/");
        setMavenConfigFile(homeDirPath + ".m2/" + "settings.xml");
        setNpmConfigPath(homeDirPath);
        setNpmConfigFile(homeDirPath + ".npmrc");
      } catch (error) {
        console.error("Error reading file:", error);
      }
    };

    readConfigFile();
  }, []);

  const data: DataType[] = [
    {
      key: "Maven",
      site: "Maven",
      mirrors: <Maven />,
      action: (
        <Space>
          <Button
            onClick={async () => {
              await open(mavenConfigPath);
            }}
          >
            打开目录
          </Button>
          <Button
            onClick={async () => {
              await open(mavenConfigFile);
            }}
          >
            打开文件
          </Button>
        </Space>
      ),
    },
    {
      key: "npm",
      site: "npm",
      mirrors: <Npm />,
      action: (
        <Space>
          <Button
            onClick={async () => {
              await open(npmConfigPath);
            }}
          >
            打开目录
          </Button>
          <Button
            onClick={async () => {
              await open(npmConfigFile);
            }}
          >
            打开文件
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table
        pagination={{ hideOnSinglePage: true }}
        columns={columns}
        dataSource={data}
      />
    </div>
  );
};

export default SiteTable;
