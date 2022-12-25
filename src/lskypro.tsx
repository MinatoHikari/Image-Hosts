import { getPreferenceValues } from "@raycast/api";
import { LskyPro } from "./hooks/urls";
import { FormScreen, GlobalPreference } from "./screens/form";
import { createReadStream } from "fs";
import { Source } from "./hooks/cache";
import FormData from "form-data";
import { Axios, AxiosResponse } from "axios";

type Prefrences = {
  token: string;
  hostname: string;
} & GlobalPreference;

type Response = {
  status: boolean;
  message: string;
  data: {
    key: string;
    name: string;
    pathname: string;
    origin_name: string;
    size: number;
    mimetype: string;
    extension: string;
    md5: string;
    sha1: string;
    links: {
      url: string;
      html: string;
      bbcode: string;
      markdown: string;
      markdown_with_link: string;
      thumbnail_url: string;
      delete_url: string;
    };
  };
};

export default function Command() {
  const { token, hostname } = getPreferenceValues<Prefrences>();
  const url = `${hostname}${LskyPro.UploadPath}`;

  const handleUpload = async (filePath: string) => {
    const client = new Axios({
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });
    const formData = new FormData();
    formData.append("file", createReadStream(filePath));
    // formData.append("permission", 1);
    return client.post<FormData, AxiosResponse<string>>(url, formData).then((res) => {
      const response: Response = JSON.parse(res.data);
      if (response.status) {
        const url = response.data.links.url;
        return { url };
      } else {
        throw response.message;
      }
    });
  };

  return <FormScreen source={Source.SMMS} onUpload={handleUpload} />;
}
